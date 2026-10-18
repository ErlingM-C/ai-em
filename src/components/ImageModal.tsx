import { useEffect, useRef, useState, type MouseEvent } from 'react'
import styles from './ImageModal.module.css'

type ImageModalProps = {
  day: number
  image: string
  alt: string
  text: string
  onClose: () => void
}

/**
 * Visar dagens bild i större format. Bygger på <dialog>, som låser fokus i
 * modalen, stängs med Escape och lämnar tillbaka fokus när den stängs.
 */
function ImageModal({ day, image, alt, text, onClose }: ImageModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog !== null && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  function closeDialog(): void {
    dialogRef.current?.close()
  }

  // Klick utanför innehållet, på den mörka bakgrunden, stänger modalen.
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>): void {
    if (event.target === event.currentTarget) {
      closeDialog()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="image-modal-title"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className={styles.content}>
        <h2 id="image-modal-title" className={styles.title}>
          {day} december
        </h2>
        {imageFailed ? (
          <p className={styles.imageError} role="alert">
            Bilden kunde inte laddas. Kontrollera att adressen i kalenderfilen stämmer: {image}
          </p>
        ) : (
          <img className={styles.image} src={image} alt={alt} onError={() => setImageFailed(true)} />
        )}
        <p className={styles.text}>{text}</p>
        <button type="button" className={styles.close} onClick={closeDialog}>
          Stäng
        </button>
      </div>
    </dialog>
  )
}

export default ImageModal
