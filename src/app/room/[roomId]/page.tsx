import { RoomClient } from '../../../components/game/RoomClient';

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return <RoomClient roomId={params.roomId.toUpperCase()} />;
}
