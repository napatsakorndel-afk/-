const fs = require('fs');
let code = fs.readFileSync('src/components/StatusChecker.tsx', 'utf8');

// Insert state
const stateTarget = `  // Sandbox state`;
const stateReplacement = `  // Payment Timer state
  const [paymentExpired, setPaymentExpired] = useState<boolean>(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState<{minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    let interval: any;
    if (selectedReg && selectedReg.status === "pending_payment" && selectedReg.createdAt) {
      const checkExpiry = () => {
        const createdDate = new Date(selectedReg.createdAt).getTime();
        const now = new Date().getTime();
        const diffMs = (createdDate + 9 * 60 * 1000) - now;
        
        if (diffMs <= 0) {
          setPaymentExpired(true);
          setPaymentTimeLeft({ minutes: 0, seconds: 0 });
          clearInterval(interval);
        } else {
          setPaymentExpired(false);
          const totalSeconds = Math.floor(diffMs / 1000);
          setPaymentTimeLeft({
            minutes: Math.floor(totalSeconds / 60),
            seconds: totalSeconds % 60
          });
        }
      };
      
      checkExpiry();
      interval = setInterval(checkExpiry, 1000);
    } else {
      setPaymentTimeLeft(null);
      setPaymentExpired(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedReg]);

  // Sandbox state`;
code = code.replace(stateTarget, stateReplacement);

// Insert UI
const uiTarget = `            {/* PAYMENT BOX (Only if status is pending_payment or rejected) */}
            {(selectedReg.status === "pending_payment" || selectedReg.status === "rejected") && (`;
const uiReplacement = `            {/* PAYMENT BOX (Only if status is pending_payment or rejected) */}
            {selectedReg.status === "pending_payment" && paymentExpired ? (
              <div className="bg-red-950/40 border border-red-500/20 rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="text-xl font-black text-white">หมดเวลาชำระเงิน</h3>
                <p className="text-red-200/80 text-sm">
                  รายการลงทะเบียนนี้เกินกำหนดเวลา 9 นาทีแล้ว กรุณาทำการสมัครใหม่อีกครั้ง
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl mt-4"
                >
                  กลับไปสมัครใหม่
                </button>
              </div>
            ) : (selectedReg.status === "pending_payment" || selectedReg.status === "rejected") && (`;

code = code.replace(uiTarget, uiReplacement);

// Insert countdown indicator
const headerTarget = `                <h3 className="text-base font-black italic uppercase tracking-wider flex items-center gap-2 text-white">
                  <CreditCard className="w-5 h-5 text-blue-500" /> ชำระเงินค่าสมัครวิ่งผ่าน PromptPay QR
                </h3>`;
const headerReplacement = `                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-base font-black italic uppercase tracking-wider flex items-center gap-2 text-white">
                    <CreditCard className="w-5 h-5 text-blue-500" /> ชำระเงินค่าสมัครวิ่ง
                  </h3>
                  {selectedReg.status === "pending_payment" && paymentTimeLeft && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
                      <Clock className="w-4 h-4 text-red-400 animate-pulse" />
                      <span className="text-red-400 font-mono font-bold text-sm">
                        เหลือเวลา {String(paymentTimeLeft.minutes).padStart(2, '0')}:{String(paymentTimeLeft.seconds).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>`;

code = code.replace(headerTarget, headerReplacement);

fs.writeFileSync('src/components/StatusChecker.tsx', code);
console.log("Patched timer logic successfully");
