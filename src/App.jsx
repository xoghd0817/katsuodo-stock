import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "./firebase";

function App() {
  const [items, setItems] = useState({
    "상로스카츠": 10,
    "히레카츠": 10,
    "로스카츠": 10,
    "통모짜 치즈카츠": 10,
  });

  useEffect(() => {
    const stockRef = ref(db, "stock");

    onValue(stockRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setItems(data);
      }
    });
  }, []);

  const changeCount = (name, amount) => {
    const newItems = {
      ...items,
      [name]: Math.max(0, items[name] + amount),
    };

    setItems(newItems);

    set(ref(db, "stock"), newItems);
  };

  return (
    <div
      style={{
        background: "#111",
        minHeight: "100vh",
        color: "white",
        padding: "40px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "40px" }}>카츠오도 본점</h1>

      <p style={{ color: "#aaa", marginBottom: "40px" }}>
        오늘의 돈카츠 잔여 수량
      </p>

      <div
        style={{
          background: "#1c1c1c",
          borderRadius: "20px",
          padding: "30px",
          maxWidth: "500px",
        }}
      >
        {Object.entries(items).map(([name, count]) => (
          <div
            key={name}
            style={{
              borderBottom: "1px solid #333",
              padding: "20px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "22px",
              }}
            >
              <span>{name}</span>

              <strong
                style={{
                  color: count === 0 ? "#ff5555" : "white",
                }}
              >
                {count === 0 ? "품절" : `${count}개`}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              <button
                onClick={() => changeCount(name, -1)}
                style={buttonStyle}
              >
                -1
              </button>

              <button
                onClick={() => changeCount(name, 1)}
                style={buttonStyle}
              >
                +1
              </button>

              <button
                onClick={() =>
                  set(ref(db, "stock"), {
                    ...items,
                    [name]: 0,
                  })
                }
                style={{
                  ...buttonStyle,
                  background: "#ff4444",
                }}
              >
                품절
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "10px",
  background: "#333",
  color: "white",
  cursor: "pointer",
  fontSize: "16px",
};

export default App;
