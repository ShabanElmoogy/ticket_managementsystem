import { Redirect } from 'expo-router';

// (tabs) is legacy — redirect to the new (app) group
export default function TabsIndex() {
  return <Redirect href="/(app)" />;
}
