import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ref, onValue, set } from "firebase/database";
import { db } from "./firebase";

const PASSWORD = "1234";

const defaultItems = {
  "상로스카츠": 10,
  "히레카츠": 10,
  "로스카츠": 10,
  "통모짜 치즈카츠": 10,
};

function PublicPage() {
  const [items, setItems] = useState(defaultItems);

  useEffect(() => {
    const stockRef = ref(db, "stock");
    onValue(stockRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setItems(data);
    });
  }, []);

  return (
    <PageLayout>
      <h1 style={titleStyle}>카츠오도 본점</h1>
      <p style={subtitleStyle}>오늘의 돈카츠 잔여 수량</p>

      <div style={cardStyle}>
        {Object.entries(items).map(([name, count]) => (
          <div key={name} style={publicRowStyle}>
            <span>{name}</span>
            <strong style={{ color: count === 0 ? "#ff5555" : "white" }}>
              {count === 0 ? "품절" : `${count}개`}
            </strong>
          </div>
        ))}
      </div>

      <p style={noticeStyle}>수량은 실시간으로 변동될 수 있습니다.</p>
    </PageLayout>
  );
}

function AdminPage() {
  const [items, setItems] = useState(defaultItems);
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const stockRef = ref(db, "stock");
    onValue(stockRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setItems(data);
    });
  }, []);

  const saveItems = (newItems) => {
    setItems(newItems);
    set(ref(db, "stock"), newItems);
  };

  const changeCount = (name, amount) => {
    const newItems = {
      ...items,
      [name]: Math.max(0, Number(items[name] || 0) + amount),
    };
    saveItems(newItems);
  };

  const setSoldOut = (name) => {
    saveItems({
      ...items,
      [name]: 0,
    });
  };

  if (!loggedIn) {
    return (
      <PageLayout>
        <h1 style={titleStyle}>관리자 로그인</h1>
        <p style={subtitleStyle}>비밀번호를 입력하세요.</p>

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button
          style={loginButtonStyle}
          onClick={() => {
            if (password === PASSWORD) {
              setLoggedIn(true);
            } else {
              alert("비밀번호가 틀렸습니다.");
            }
          }}
        >
          로그인
        </button>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <h1 style={titleStyle}>카츠오도 수량 관리</h1>
      <p style={subtitleStyle}>관리자 전용 화면입니다.</p>

      <div style={cardStyle}>
        {Object.entries(items).map(([name, count]) => (
          <div key={name} style={adminRowStyle}>
            <div style={adminTopStyle}>
              <span>{name}</span>
              <strong style={{ color: count === 0 ? "#ff5555" : "white" }}>
                {count === 0 ? "품절" : `${count}개`}
              </strong>
            </div>

            <div style={buttonGroupStyle}>
              <button onClick={() => changeCount(name, -1)} style={buttonStyle}>
                -1
              </button>
              <button onClick={() => changeCount(name, 1)} style={buttonStyle}>
                +1
              </button>
              <button onClick={() => setSoldOut(name)} style={soldOutButtonStyle}>
                품절
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function PageLayout({ children }) {
  return (
    <div
      style={{
        background: "#111",
        minHeight: "100vh",
        color: "white",
        padding: "40px 20px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>{children}</div>
    </div>
  );
}

const titleStyle = {
  fontSize: "34px",
  marginBottom: "10px",
};

const subtitleStyle = {
  color: "#aaa",
  marginBottom: "30px",
};

const cardStyle = {
  background: "#1c1c1c",
  borderRadius: "20px",
  padding: "24px",
};

const publicRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "20px 0",
  borderBottom: "1px solid #333",
  fontSize: "22px",
};

const adminRowStyle = {
  borderBottom: "1px solid #333",
  padding: "20px 0",
};

const adminTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "22px",
  marginBottom: "15px",
};

const buttonGroupStyle = {
  display: "flex",
  gap: "10px",
};

const buttonStyle = {
  padding: "12px 18px",
  border: "none",
  borderRadius: "10px",
  background: "#333",
  color: "white",
  cursor: "pointer",
  fontSize: "16px",
};

const soldOutButtonStyle = {
  ...buttonStyle,
  background: "#ff4444",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "16px",
  borderRadius: "12px",
  border: "none",
  fontSize: "18px",
  marginBottom: "16px",
};

const loginButtonStyle = {
  width: "100%",
  padding: "16px",
  border: "none",
  borderRadius: "12px",
  background: "white",
  color: "#111",
  fontSize: "18px",
  cursor: "pointer",
};

const noticeStyle = {
  color: "#777",
  marginTop: "20px",
  fontSize: "14px",
};

export default App;
