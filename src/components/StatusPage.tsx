import type { ReactNode } from 'react'
import styles from './StatusPage.module.css'

type StatusPageProps = {
  title: string
  children: ReactNode
}

function StatusPage({ title, children }: StatusPageProps) {
  return (
    <main className={styles.page}>
      <h1>{title}</h1>
      {children}
    </main>
  )
}

export default StatusPage
