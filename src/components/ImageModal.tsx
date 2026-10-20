import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type SyntheticEvent,
} from 'react'
import { flipTransform, type Rect } from '../lib/flipTransform.ts'
import styles from './ImageModal.module.css'
import Snow from './Snow.tsx'

type ImageModalProps = {
  day: number
  image: string
  alt: string
  text: string
  /** Elementet som modalen växer fram ur och krymper tillbaka till. */
  origin: HTMLElement
  reducedMotion: boolean
  onClose: () => void
}

const OPEN_MS = 450
const CLOSE_MS = 350
const OPEN_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'
const CLOSE_EASING = 'cubic-bezier(0.5, 0, 0.75, 0)'

/** Äldre webbläsare, till exempel Safari före 15.4, saknar showModal för <dialog>. */
function supportsModalDialog(dialog: HTMLDialogElement): boolean {
  return typeof dialog.showModal === 'function'
}

/**
 * Startar en animering, eller returnerar null om det inte går. Äldre webbläsare saknar
 * Web Animations eller kan inte animera allt (till exempel ::backdrop). Då visas
 * ändringen direkt i stället.
 */
function tryAnimate(
  element: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions,
): Animation | null {
  if (typeof element.animate !== 'function') {
    return null
  }
  try {
    return element.animate(keyframes, options)
  } catch {
    return null
  }
}

function cancelAnimations(element: Element): void {
  if (typeof element.getAnimations === 'function') {
    element.getAnimations({ subtree: true }).forEach((animation) => animation.cancel())
  }
}

function rectOf(element: Element): Rect {
  const { x, y, width, height } = element.getBoundingClientRect()
  return { x, y, width, height }
}

/** Keyframes från luckans läge till modalens eget läge. */
function growKeyframes(dialog: HTMLDialogElement, origin: HTMLElement): Keyframe[] {
  return [
    { transform: flipTransform(rectOf(origin), rectOf(dialog)), opacity: 0.4 },
    { transform: 'none', opacity: 1 },
  ]
}

function animateBackdrop(dialog: HTMLDialogElement, from: number, to: number, duration: number): void {
  tryAnimate(dialog, { opacity: [from, to] }, { duration, pseudoElement: '::backdrop', fill: 'forwards' })
}

/** Låter modalen växa fram ur luckan. */
function animateOpen(dialog: HTMLDialogElement, content: HTMLElement | null, origin: HTMLElement): void {
  tryAnimate(dialog, growKeyframes(dialog, origin), { duration: OPEN_MS, easing: OPEN_EASING })
  if (content !== null) {
    tryAnimate(content, { opacity: [0, 0, 1], offset: [0, 0.4, 1] }, { duration: OPEN_MS })
  }
  animateBackdrop(dialog, 0, 1, OPEN_MS)
}

/** Krymper modalen tillbaka till luckan. Returnerar null om webbläsaren inte kan animera. */
function animateClose(dialog: HTMLDialogElement, content: HTMLElement | null, origin: HTMLElement): Animation | null {
  const shrink = tryAnimate(dialog, growKeyframes(dialog, origin).reverse(), {
    duration: CLOSE_MS,
    easing: CLOSE_EASING,
    fill: 'forwards',
  })
  if (content !== null) {
    tryAnimate(content, { opacity: [1, 0, 0], offset: [0, 0.5, 1] }, { duration: CLOSE_MS, fill: 'forwards' })
  }
  animateBackdrop(dialog, 1, 0, CLOSE_MS)
  return shrink
}

/**
 * Bildrutan får bildens egna proportioner och blir så stor som möjligt, så att
 * ytan bredvid bilden är tom och går att klicka på för att stänga.
 * Innan bilden har laddats fyller rutan hela modalen.
 */
function figureStyle(aspectRatio: number | null): CSSProperties {
  if (aspectRatio === null) {
    return { width: '100%', height: '100%' }
  }
  return {
    aspectRatio: String(aspectRatio),
    width: `min(100%, calc((100dvh - 2rem) * ${aspectRatio}))`,
  }
}

/**
 * Visar dagens bild i större format. Bygger på <dialog>, som låser fokus i
 * modalen, stängs med Escape och lämnar tillbaka fokus när den stängs.
 * Modalen växer fram ur luckan och krymper tillbaka dit när den stängs.
 */
function ImageModal({ day, image, alt, text, origin, reducedMotion, onClose }: ImageModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>): void {
    const { naturalWidth, naturalHeight } = event.currentTarget
    if (naturalWidth > 0 && naturalHeight > 0) {
      setAspectRatio(naturalWidth / naturalHeight)
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null || dialog.hasAttribute('open')) {
      return
    }
    if (supportsModalDialog(dialog)) {
      dialog.showModal()
    } else {
      // Reserv: modalen visas ovanpå sidan. Krysset och klick utanför bilden stänger den,
      // men fokus fångas inte och Escape fungerar inte.
      dialog.setAttribute('open', '')
    }
    if (!reducedMotion) {
      animateOpen(dialog, contentRef.current, origin)
    }
  }, [origin, reducedMotion])

  function closeNow(dialog: HTMLDialogElement): void {
    if (supportsModalDialog(dialog)) {
      // Utlöser close-händelsen, som anropar onClose.
      dialog.close()
    } else {
      onClose()
    }
  }

  function closeDialog(): void {
    const dialog = dialogRef.current
    if (dialog === null || closingRef.current) {
      return
    }
    closingRef.current = true
    // Avbryt en pågående öppning, så att modalens läge mäts utan transform.
    cancelAnimations(dialog)
    const shrink = reducedMotion ? null : animateClose(dialog, contentRef.current, origin)
    if (shrink === null) {
      closeNow(dialog)
      return
    }
    shrink.finished.then(
      () => closeNow(dialog),
      () => closeNow(dialog),
    )
  }

  // Escape stänger modalen. Den stängs via closeDialog så att animeringen hinner köras.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>): void {
    event.preventDefault()
    closeDialog()
  }

  // Klick på tom yta stänger modalen: den mörka bakgrunden runt modalen
  // och ytan bredvid bilden. Klick på bilden, texten och krysset räknas inte.
  function handleOutsideClick(event: MouseEvent<HTMLDialogElement>): void {
    if (event.target === event.currentTarget || event.target === contentRef.current) {
      closeDialog()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="image-modal-title"
      onCancel={handleCancel}
      onClose={onClose}
      onClick={handleOutsideClick}
    >
      <div ref={contentRef} className={styles.content}>
        <button type="button" className={styles.close} aria-label="Stäng" onClick={closeDialog}>
          <span aria-hidden="true">✕</span>
        </button>
        <figure className={styles.figure} style={figureStyle(imageFailed ? null : aspectRatio)}>
          {imageFailed ? (
            <p className={styles.imageError} role="alert">
              Bilden kunde inte laddas. Kontrollera att adressen i kalenderfilen stämmer: {image}
            </p>
          ) : (
            <img
              className={styles.image}
              src={image}
              alt={alt}
              onLoad={handleImageLoad}
              onError={() => setImageFailed(true)}
            />
          )}
          <figcaption className={styles.caption}>
            <h2 id="image-modal-title" className={styles.title}>
              {day} december
            </h2>
            <p className={styles.text}>{text}</p>
          </figcaption>
        </figure>
        {!reducedMotion && <Snow placement="inside" intensity="minimal" />}
      </div>
    </dialog>
  )
}

export default ImageModal
