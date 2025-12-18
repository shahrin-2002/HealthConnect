import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import DoctorAvailability from "./pages/DoctorAvailability";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/availability" element={<DoctorAvailability />} />
      </Routes>
    </BrowserRouter>
  );
}
