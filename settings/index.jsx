import * as secrets from "../companion/secrets.js";

function mySettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Connect your OuraRing account</Text>}>
        <Oauth
          settingsKey="oauth"
          title="Login"
          label="Oura"
          status="Login into your Oura account"
          authorizeUrl="https://cloud.ouraring.com/oauth/authorize"
          requestTokenUrl="https://api.ouraring.com/oauth/token"
          clientId={secrets.CLIENT_ID}
          clientSecret={secrets.CLIENT_SECRET}
          scope="personal daily"
          onReturn={async (data) => {
            props.settingsStorage.setItem('oura_code', data.code);
          }}
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);
