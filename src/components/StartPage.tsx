import StatusPage from './StatusPage.tsx'

type StartPageProps = {
  origin: string
  /** Sökvägen där webbplatsen ligger, till exempel "/" eller "/ai-em/". */
  basePath: string
}

function StartPage({ origin, basePath }: StartPageProps) {
  const demoJson = `${basePath}examples/demo.json`
  return (
    <StatusPage title="Gör din egen adventskalender">
      <p>
        Skapa en JSON-fil med en bakgrundsbild och 24 luckor, lägg upp den på en webbadress som
        börjar med <code>https://</code> och dela en länk som denna:
      </p>
      <p>
        <code>{`${origin}${basePath}?config=https://example.com/min-kalender.json`}</code>
      </p>
      <p>
        <a href={`${basePath}?config=${demoJson}&preview=1`}>Se exempelkalendern</a> eller titta på{' '}
        <a href={demoJson}>exemplets JSON-fil</a>.
      </p>
    </StatusPage>
  )
}

export default StartPage
