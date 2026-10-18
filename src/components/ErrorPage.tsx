import StatusPage from './StatusPage.tsx'

type ErrorPageProps = {
  errors: string[]
}

function ErrorPage({ errors }: ErrorPageProps) {
  return (
    <StatusPage title="Kalendern kunde inte visas">
      <p role="alert">Det här behöver rättas i kalenderfilen eller länken:</p>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </StatusPage>
  )
}

export default ErrorPage
