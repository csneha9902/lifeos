import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarViewer from "./AvatarViewer";

export default function AvatarSelect() {
  const [avatar, setAvatar] = useState("/avatars/kids_avatars.glb");
  const navigate = useNavigate();

  const handleConfirm = () => {
    localStorage.setItem("userAvatar", avatar);
    navigate("/dashboard");
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>Choose Your Avatar</h2>
      
      {/* For now we just have one example model from previous steps */}
      <div style={{ margin: "1rem 0" }}>
        <button onClick={() => setAvatar("/avatars/kids_avatars.glb")} style={{ margin: "0 10px", padding: "10px 20px" }}>
          Default Avatar
        </button>
      </div>

      <div style={{ border: "2px solid #ddd", borderRadius: "10px", margin: "20px auto", maxWidth: "400px" }}>
        <AvatarViewer avatar={avatar} />
      </div>

      <button 
        onClick={handleConfirm}
        style={{ padding: "15px 30px", fontSize: "1.2rem", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
      >
        Confirm Selection
      </button>
    </div>
  );
}
