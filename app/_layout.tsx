import { Stack } from "expo-router";
import { LeagueProvider } from "../context/LeagueContext";
import { TenantProvider } from "../context/TenantContext";

const RootLayout = () => {
  return (
    <TenantProvider key="tenantProvider">
      <LeagueProvider key="leagueProvider">
        <Stack screenOptions={{ headerShown: false }} />
      </LeagueProvider>
    </TenantProvider>
  );
}

export default RootLayout;