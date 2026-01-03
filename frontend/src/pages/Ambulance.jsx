import { GoogleMap, Marker } from "@react-google-maps/api";

export default function Ambulance() {
  return (
    <GoogleMap zoom={15} center={{ lat: 23.8103, lng: 90.4125 }}>
      <Marker position={{ lat: 23.81, lng: 90.41 }} />
    </GoogleMap>
  );
}
