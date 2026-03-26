import { Redirect } from 'expo-router';

export default function ReservationFlowIndex() {
  return <Redirect href={{ pathname: '/maps', params: { tab: 'list' } }} />;
}
