import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ref, onValue, set, get, push } from "firebase/database";
import { db } from "./firebase";

const PASSWORD = "1234";

const defaultItems = {
  "상로스카츠": 10,
  "히레카츠": 10,
  "로스카츠": 10,
  "통모짜 치즈카츠": 10,
};

const OPEN_HOUR = 11;
const OPEN_MINUTE = 20;
const LAST_ORDER_HOUR = 20;
const LAST_ORDER_MINUTE = 0;
const CLOSE_HOUR = 21;
const CLOSE_MINUTE = 0;

function getBusinessStatus() {
  const now = new Date();

  const openTime = new Date();
  openTime.setHours(OPEN_HOUR, OPEN_MINUTE, 0, 0);

  const lastOrderTime = new Date();
  lastOrderTime.setHours(LAST_ORDER_HOUR, LAST_ORDER_MINUTE, 0, 0);

  const closeTime = new Date();
  closeTime.setHours(CLOSE_HOUR, CLOSE_MINUTE, 0, 0);

  if (now < openTime) {
    return {
      label: "영업 준비중",
      message: "오전 11:20 오픈 예정입니다.",
      color: "#ffaa00",
    };
  }

  if (now >= openTime && now < lastOrderTime) {
    return {
      label: "영업중",
      message: "재고 수량은 실시간으로 변동됩니다.",
      color: "#00ff99",
    };
  }

  if (now >= lastOrderTime && now < closeTime) {
    return {
      label: "라스트오더 종료",
      message: "금일 주문 접수가 마감되었습니다.",
      color: "#ff5555",
    };
  }

  return {
    label: "영업 종료",
    message: "금일 영업이 종료되었습니다.",
    color: "#777",
  };
}

function PublicPage() {
  const [items, setItems] = useState(defaultItems);
  const [lastUpdated, setLastUpdated] = useState("");
  const [estimatedEndTime, setEstimatedEndTime] = useState("계산 중");

  const businessStatus = getBusinessStatus();

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    const alreadyVisited = sessionStorage.getItem("visitedToday");

    if (!alreadyVisited) {
      const visitRef = ref(db, `analytics/${today}/visits`);

      get(visitRef).then((snapshot) => {
        const current = snapshot.val() || 0;
        set(visitRef, current + 1);
        sessionStorage.setItem("visitedToday", "true");
      });
    }
  }, []);

  useEffect(() => {
    const stockRef = ref(db, "stock");

    onValue(stockRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setItems(data);
      }
    });
  }, []);

  useEffect(() => {
    const updatedRef = ref(db, "lastUpdated");

    onValue(updatedRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setLastUpdated(
          new Date(data).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    });
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const logRef = ref(db, `salesLog/${today}`);

    const unsubscribe = onValue(logRef, (snapshot) => {
      const data = snapshot.val();
      const logs = data ? Object.values(data) : [];

      const totalStock = Object.values(items).reduce(
        (sum, count) => sum + Number(count || 0),
        0
      );

      if (totalStock === 0) {
        setEstimatedEndTime("이미 품절");
        return;
      }

      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      const recentLogs = logs.filter((log) => log.time >= oneHourAgo);

      const soldLastHour = recentLogs.reduce(
        (sum, log) => sum + Number(log.soldCount || 0),
        0
      );

      if (soldLastHour === 0) {
        setEstimatedEndTime("최근 판매 기록 부족");
        return;
      }

      const hoursLeft = totalStock / soldLastHour;
      const estimatedTime = new Date(now + hoursLeft * 60 * 60 * 1000);

      setEstimatedEndTime(
        estimatedTime.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    });

    return () => unsubscribe();
  }, [items]);
  return (
    <PageLayout>
      <h1 style={titleStyle}>카츠오도 본점</h1>
      <p style={subtitleStyle}>오늘의 돈카츠 잔여 수량</p>
<div style={statusBoxStyle}>
  <div style={{ color: businessStatus.color, fontWeight: "bold", fontSize: "20px" }}>
    {businessStatus.label}
  </div>
  <div style={{ color: "#aaa", marginTop: "8px", fontSize: "15px" }}>
    {businessStatus.message}
  </div>
</div>
<div style={estimateBoxStyle}>
  예상 품절 시간: {estimatedEndTime}
</div>


      <div style={cardStyle}>
        {Object.entries(items).map(([name, count]) => (
          <div key={name} style={publicRowStyle}>
            <span>{name}</span>
            <strong
  style={{
    color: count === 0 ? "#ff5555" : count <= 3 ? "#ffaa00" : "white",
  }}
>
  {count === 0 ? "품절" : count <= 3 ? `거의 품절 · ${count}개` : `${count}개`}
</strong>
          </div>
        ))}
      </div>
{lastUpdated && (
  <p style={lastUpdatedStyle}>마지막 업데이트: {lastUpdated}</p>
)}
      <p style={noticeStyle}>수량은 실시간으로 변동될 수 있습니다.</p>
    </PageLayout>
  );
}

function AdminPage() {
  const [items, setItems] = useState(defaultItems);
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [todayVisits, setTodayVisits] = useState(0);
  const [estimatedEndTime, setEstimatedEndTime] = useState("계산 중");
  const [lastUpdated, setLastUpdated] = useState("");


  useEffect(() => {
    const stockRef = ref(db, "stock");
    onValue(stockRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setItems(data);
    });
  }, []);
  useEffect(() => {
  const today = new Date().toISOString().split("T")[0];
  const visitRef = ref(db, `analytics/${today}/visits`);

  onValue(visitRef, (snapshot) => {
    setTodayVisits(snapshot.val() || 0);
  });
}, []);
useEffect(() => {
  const today = new Date().toISOString().split("T")[0];
  const logRef = ref(db, `salesLog/${today}`);

  const unsubscribe = onValue(logRef, (snapshot) => {
    const data = snapshot.val();
    const logs = data ? Object.values(data) : [];

    const totalStock = Object.values(items).reduce(
      (sum, count) => sum + Number(count || 0),
      0
    );

    if (totalStock === 0) {
      setEstimatedEndTime("이미 품절");
      return;
    }

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentLogs = logs.filter((log) => log.time >= oneHourAgo);

    const soldLastHour = recentLogs.reduce(
      (sum, log) => sum + Number(log.soldCount || 0),
      0
    );

    if (soldLastHour === 0) {
      setEstimatedEndTime("최근 판매 기록 부족");
      return;
    }

    const hoursLeft = totalStock / soldLastHour;
    const estimatedTime = new Date(now + hoursLeft * 60 * 60 * 1000);

    setEstimatedEndTime(
      estimatedTime.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  });

  return () => unsubscribe();
}, [items]);

const saveItems = (newItems) => {
  const updatedAt = Date.now();

  setItems(newItems);
  set(ref(db, "stock"), newItems);
  set(ref(db, "lastUpdated"), updatedAt);
};

  const saveSalesLog = (name, soldCount) => {
  const today = new Date().toISOString().split("T")[0];

  push(ref(db, `salesLog/${today}`), {
    name,
    soldCount,
    time: Date.now(),
  });
};

  const changeCount = (name, amount) => {
  const currentCount = Number(items[name] || 0);
  const newCount = Math.max(0, currentCount + amount);

  const newItems = {
    ...items,
    [name]: newCount,
  };

  saveItems(newItems);

  if (amount < 0) {
    const soldCount = currentCount - newCount;
    if (soldCount > 0) {
      saveSalesLog(name, soldCount);
    }
  }
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
      <p style={{ color: "#00ff99", marginBottom: "20px" }}>
  오늘 방문자 수: {todayVisits}명
</p>

<p style={{ color: "#ffaa00", marginBottom: "20px" }}>
  예상 영업 종료시간: {estimatedEndTime}
</p>

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
  color: "#ff8800",
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

const statusBoxStyle = {
  background: "#181818",
  border: "1px solid #333",
  borderRadius: "16px",
  padding: "18px",
  marginBottom: "24px",
};
const lastUpdatedStyle = {
  color: "#999",
  marginTop: "20px",
  fontSize: "14px",
  textAlign: "center",
};

const estimateBoxStyle = {
  background: "#151515",
  border: "1px solid #333",
  borderRadius: "14px",
  padding: "14px",
  marginBottom: "24px",
  color: "#ffaa00",
  fontSize: "16px",
  textAlign: "center",
  fontWeight: "bold",
};