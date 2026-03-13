export default function ArchetypeSelect() {
  function choose(type) {
    localStorage.setItem("archetype", type);
    window.location.href = "/dashboard";
  }

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>Select Your Archetype</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", marginTop: "20px" }}>
        <button onClick={() => choose("high_achiever")} style={{ padding: "10px 20px", width: "200px" }}>High Achiever</button>
        <button onClick={() => choose("creative_sprinter")} style={{ padding: "10px 20px", width: "200px" }}>Creative Sprinter</button>
        <button onClick={() => choose("impulsive")} style={{ padding: "10px 20px", width: "200px" }}>Impulsive</button>
        <button onClick={() => choose("perfectionist")} style={{ padding: "10px 20px", width: "200px" }}>Perfectionist</button>
        <button onClick={() => choose("wanderer")} style={{ padding: "10px 20px", width: "200px" }}>Wanderer</button>
        <button onClick={() => choose("stoic")} style={{ padding: "10px 20px", width: "200px" }}>Stoic</button>
      </div>
    </div>
  );
}
