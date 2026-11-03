import StatusPage from './StatusPage.tsx'

type ErrorPageProps = {
  errors: string[]
}

function ErrorPage({ errors }: ErrorPageProps) {
  return (
    <StatusPage title="Kalendern kunde inte visas">
      <p role="alert">Det här gick fel:</p>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
      <p>
        Har du fått länken av någon annan? Skicka det här felmeddelandet till den personen, så kan hen
        rätta kalendern.
      </p>
    </StatusPage>
  )
}

export default ErrorPage
