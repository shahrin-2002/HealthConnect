import axios from "../api/axios";

export default function Availability() {
  const save = () => axios.post("/availability", {
    doctorId: "123",
    date: "2025-01-20",
    slots: ["10AM", "11AM"]
  });

  return <button onClick={save}>Save Availability</button>;
}
