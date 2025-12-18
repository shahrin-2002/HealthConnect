import { useState } from "react";
import api from "../services/api";

export default function DoctorAvailability() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState("");

  const save = async () => {
    const slotArr = slots.split(",").map(t => ({
      time: t,
      isBooked: false,
    }));

    await api.post(
      "/availability",
      { date, slots: slotArr },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    alert("Availability Saved");
  };

  return (
    <>
      <input type="date" onChange={e => setDate(e.target.value)} />
      <input placeholder="10:00,11:00" onChange={e => setSlots(e.target.value)} />
      <button onClick={save}>Save</button>
    </>
  );
}
