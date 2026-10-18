import StatusPage from './StatusPage.tsx'

type StartPageProps = {
  origin: string
}

const DEMO_LINK = '/?config=/examples/demo.json&preview=1'

function StartPage({ origin }: StartPageProps) {
  return (
    <StatusPage title="Gör din egen adventskalender">
      <p>
        Skapa en JSON-fil med en bakgrundsbild och 24 luckor, lägg upp den på en webbadress som
        börjar med <code>https://</code> och dela en länk som denna:
      </p>
      <p>
        <code>{`${origin}/?config=https://example.com/min-kalender.json`}</code>
      </p>
      <p>
        <a href={DEMO_LINK}>Se exempelkalendern</a> eller titta på{' '}
        <a href="/examples/demo.json">exemplets JSON-fil</a>.
      </p>
    </StatusPage>
  )
}

export default StartPage
