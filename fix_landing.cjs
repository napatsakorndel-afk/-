const fs = require('fs');

let backup = fs.readFileSync('backup_LandingPage.tsx', 'utf8');

// I will rebuild it using string manipulation to inject new components but keep logic.
// This is safest.

// We need to just inject our new UI into the return statement of LandingPage.

const ui = `
    <div className="min-h-screen bg-[#00CFCF] text-white selection:bg-white/30 font-sans">
      {/* Header / Navigation */}
      <header className="fixed w-full z-50 transition-all duration-300 bg-[#00CFCF]/90 backdrop-blur-xl border-b border-white/20 shadow-md">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#00CFCF] flex items-center justify-center font-black text-xl shadow-lg shadow-black/10 transform -rotate-6">
                LS
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter uppercase leading-none">LSEd Running</span>
                <span className="text-xs text-white/70 font-bold tracking-widest uppercase">2026 Edition</span>
              </div>
            </div>
            
            {/* Nav actions */}
            <div className="hidden md:flex items-center gap-6 text-sm font-bold tracking-widest uppercase">
              <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
              <a href="#distances" className="text-white/80 hover:text-white transition-colors">Distances</a>
              <a href="#shirts" className="text-white/80 hover:text-white transition-colors">Shirts</a>
              <a href="#medals" className="text-white/80 hover:text-white transition-colors">Medals</a>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={onCheckStatusClick}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white hover:bg-white hover:text-[#00CFCF] font-black uppercase tracking-widest text-xs transition-colors"
              >
                ตรวจสอบสถานะ
              </button>
              {onCheckShippingClick && (
                <button 
                  onClick={onCheckShippingClick}
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white hover:bg-white hover:text-[#00CFCF] font-black uppercase tracking-widest text-xs transition-colors"
                >
                  <Truck className="w-4 h-4" /> ตรวจสอบพัสดุ
                </button>
              )}
              <button 
                onClick={() => onRegisterClick()}
                className="px-6 py-2.5 rounded-xl bg-[#FF6B1A] text-white hover:bg-white hover:text-[#00CFCF] font-black uppercase tracking-widest text-xs shadow-xl shadow-[#FF6B1A]/20 transition-all flex items-center gap-2"
              >
                สมัครวิ่ง <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#00CFCF]">
        {/* Graphic Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          {/* Abstract Orange Squiggles matching the reference (using SVG overlay or just colored blobs) */}
          <div className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-[#FF6B1A]/40 blur-[100px]" />
          <div className="absolute top-40 -right-20 w-[300px] h-[300px] rounded-full bg-white/20 blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-8 flex flex-col items-center">
            
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/40 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> 13 ธันวาคม 2569
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter uppercase leading-[0.85] text-white drop-shadow-2xl">
              GET <br/>
              <span className="text-[#FF6B1A]">MOVING</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 max-w-2xl font-bold uppercase tracking-widest leading-relaxed">
              No comfort zones, only progress.<br/>
              วิ่งเพื่อสุขภาพและระดมทุนการศึกษาเพื่อนักศึกษาที่ขาดแคลนทุนทรัพย์
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 w-full sm:w-auto">
              <button 
                onClick={() => onRegisterClick()}
                className="w-full sm:w-auto px-10 py-5 bg-[#FF6B1A] hover:bg-white hover:text-[#00CFCF] text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-xl shadow-[#FF6B1A]/30 transition-colors flex items-center justify-center gap-2"
              >
                สมัครเข้าร่วมกิจกรรม <ChevronRight className="w-5 h-5" />
              </button>
              <a 
                href="#distances"
                className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-white hover:bg-white hover:text-[#00CFCF] text-white font-black uppercase tracking-widest text-sm rounded-xl transition-colors flex items-center justify-center"
              >
                ดูรายละเอียดระยะทาง
              </a>
            </div>

            {/* Event Countdown */}
            <div className="pt-16 pb-4 w-full max-w-3xl border-t border-white/20 mt-12 grid grid-cols-4 gap-4 md:gap-8">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Mins', value: timeLeft.minutes },
                { label: 'Secs', value: timeLeft.seconds }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="text-4xl md:text-6xl font-black italic tracking-tighter text-white tabular-nums drop-shadow-md">
                    {item.value.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[10px] md:text-xs text-white/70 font-bold uppercase tracking-widest mt-1">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white text-[#00CFCF] py-20 relative z-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center justify-center p-8 rounded-3xl bg-[#00CFCF]/5 border-none shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#FF6B1A]/20 text-[#FF6B1A] mb-6">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-[#00CFCF] font-black text-4xl mb-2 tracking-tighter">
                  {stat.value}
                </div>
                <div className="text-[#00CFCF]/60 text-xs font-bold uppercase tracking-widest text-center">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-24 space-y-32">
        
        {/* Distances Section */}
        <section className="space-y-12" id="distances">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white flex items-center justify-center gap-4">
               ประเภทกิจกรรม 
            </h2>
            <p className="text-white/80 text-lg font-bold tracking-widest uppercase">เลือกร่วมวิ่งตามระยะทาง หรือร่วมบริจาคสนับสนุน</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {distances.map((dist, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col transform hover:-translate-y-2 transition-transform duration-300 border-b-8 border-[#FF6B1A]"
                id={'distance-card-'+dist.type}
              >
                <div className="p-8 bg-[#00CFCF]/10 border-b border-[#00CFCF]/10 text-[#00CFCF]">
                  <div className="flex flex-col gap-3 items-start">
                    <span className="text-4xl font-black italic tracking-tighter uppercase leading-none">{typeLabels[dist.type]}</span>
                    <span className="bg-[#FF6B1A] text-white font-black text-xs px-3 py-1.5 rounded-full uppercase tracking-widest">
                      {dist.time}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold tracking-tight mt-6 leading-snug">{dist.title}</h3>
                  <p className="text-sm text-[#00CFCF]/60 tracking-wide font-bold uppercase mt-2">{dist.subtitle}</p>
                </div>

                <div className="p-8 flex-grow flex flex-col justify-between space-y-8">
                  <div className="space-y-6 text-[#00CFCF]/80 leading-relaxed font-medium">
                    <p className="text-sm md:text-base leading-relaxed">{dist.desc}</p>
                    
                    <div>
                      <span className="text-xs sm:text-sm text-[#00CFCF]/50 block font-bold uppercase tracking-wider mb-3">{dist.type === 'donation' ? 'การร่วมสมทบทุน' : 'ค่าสมัครเข้าร่วม'}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[#FF6B1A] text-5xl font-black italic tracking-tighter">{dist.price.toLocaleString()}</span>
                        <span className="text-[#FF6B1A]/60 text-sm font-bold uppercase tracking-widest">บาท / ท่าน</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#00CFCF]/10 space-y-4">
                    <span className="text-xs sm:text-sm text-[#00CFCF]/50 block font-bold uppercase tracking-wider">ของที่ระลึก:</span>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#FF6B1A] shrink-0 mt-0.5" />
                      <span className="text-[#00CFCF] text-sm font-bold leading-relaxed">{dist.gift}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => onRegisterClick(dist.type)}
                    className="w-full py-4 rounded-xl bg-[#00CFCF] hover:bg-[#FF6B1A] text-white font-black uppercase tracking-widest text-sm transition-colors mt-4"
                  >
                    สมัคร {typeLabels[dist.type]}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Shirts Section */}
        <section className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center" id="shirts">
          <div className="lg:col-span-6 space-y-8 order-last lg:order-first">
            <div className="inline-flex items-center gap-2 bg-[#FF6B1A]/10 text-[#FF6B1A] px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase">
              <Shirt className="w-4 h-4" /> LSEd Running Jersey 2026
            </div>
            <h2 className="text-5xl font-black italic tracking-tighter uppercase text-[#00CFCF] leading-tight">
              เสื้อที่ระลึกสุดพรีเมียม
            </h2>
            <div className="text-[#00CFCF]/80 leading-relaxed font-medium text-sm space-y-4">
              <p>
                เสื้อวิ่งที่ตัดเย็บจาก <strong>ผ้าดาวกระจาย (หรือผ้าไมโครลายดาวกระจาย)</strong> เป็นตัวเลือกยอดนิยมสำหรับสายวิ่งและคนออกกำลังกาย เนื่องจากเนื้อผ้ามีลายทอเป็นจุดรูตาข่ายเล็กๆ ช่วยระบายอากาศและความร้อนได้ดีเยี่ยม แห้งไว น้ำหนักเบา และสวมใส่สบายในราคาย่อมเยา
              </p>
              <div className="space-y-3 p-4 bg-[#00CFCF]/5 rounded-2xl">
                <strong className="text-[#00CFCF] block text-sm uppercase tracking-widest">คุณสมบัติเด่นของผ้าดาวกระจาย</strong>
                <ul className="list-none space-y-2 text-[#00CFCF]/80">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF6B1A] shrink-0 mt-0.5"/> <span><strong className="text-[#00CFCF]">ระบายอากาศดี:</strong> โครงสร้างลายรูเล็กๆ ช่วยให้ลมผ่านได้ดี</span></li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF6B1A] shrink-0 mt-0.5"/> <span><strong className="text-[#00CFCF]">แห้งไว ไม่อับชื้น:</strong> ซับเหงื่อได้ดีและแห้งเร็ว</span></li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF6B1A] shrink-0 mt-0.5"/> <span><strong className="text-[#00CFCF]">น้ำหนักเบา:</strong> สวมใส่แล้วรู้สึกสบายตัว</span></li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF6B1A] shrink-0 mt-0.5"/> <span><strong className="text-[#00CFCF]">สัมผัสนุ่มลื่น:</strong> ผิวผ้าไม่ยับง่าย ไม่ย้วย</span></li>
                </ul>
              </div>
            </div>

            {/* Size Chart Table */}
            <div className="overflow-x-auto rounded-2xl bg-[#00CFCF]/5">
              <table className="w-full text-sm text-left text-[#00CFCF]/80">
                <thead className="text-xs text-[#00CFCF] uppercase bg-[#00CFCF]/10 font-bold tracking-widest">
                  <tr>
                    <th className="px-5 py-4">ไซส์</th>
                    <th className="px-5 py-4">รอบอก (นิ้ว)</th>
                    <th className="px-5 py-4">ความยาว (นิ้ว)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#00CFCF]/10 font-medium">
                  {[
                    { size: "XS", chest: "34", length: "25" },
                    { size: "S", chest: "36", length: "26" },
                    { size: "M", chest: "38", length: "27" },
                    { size: "L", chest: "40", length: "28" },
                    { size: "XL", chest: "42", length: "29" },
                    { size: "2XL", chest: "44", length: "30" },
                    { size: "3XL", chest: "46", length: "31" },
                  ].map((row) => (
                    <tr key={row.size} className="hover:bg-[#00CFCF]/10 transition-colors">
                      <td className="px-5 py-3 text-[#FF6B1A] font-black">{row.size}</td>
                      <td className="px-5 py-3">{row.chest}</td>
                      <td className="px-5 py-3">{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-4">
            {shirtImage ? (
              <div className="relative bg-[#00CFCF]/5 rounded-3xl p-4 w-full max-w-sm flex flex-col items-center justify-center aspect-[3/4] shadow-inner border border-[#00CFCF]/10">
                <img src={shirtImage} alt="Shirt Image" className="w-full h-full object-contain rounded-2xl" />
              </div>
            ) : (
              <div className="relative bg-[#00CFCF]/5 border-2 border-[#00CFCF]/20 border-dashed rounded-3xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner">
                <Shirt className="w-16 h-16 mb-4 opacity-30 text-[#00CFCF]" />
                <span className="text-sm text-[#00CFCF]/40 font-black uppercase tracking-widest text-center">รออัปโหลดภาพเสื้อที่ระลึก</span>
              </div>
            )}
          </div>
        </section>

        {/* Medal Section */}
        <section className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center" id="medals">
          <div className="lg:col-span-6 flex flex-col items-center space-y-6 order-last lg:order-first">
            {medalImage ? (
              <div className="relative bg-[#00CFCF]/5 rounded-3xl w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner p-4 group overflow-hidden border border-[#00CFCF]/10">
                <img src={medalImage} alt="Medal Image" className="w-full h-full object-contain rounded-2xl drop-shadow-2xl group-hover:scale-105 transition-transform duration-500" />
              </div>
            ) : (
              <div className="relative bg-[#00CFCF]/5 border-2 border-[#00CFCF]/20 border-dashed rounded-3xl p-6 md:p-10 w-full max-w-sm flex flex-col items-center justify-center aspect-square shadow-inner">
                <Medal className="w-16 h-16 mb-4 opacity-30 text-[#00CFCF]" />
                <span className="text-sm text-[#00CFCF]/40 font-black uppercase tracking-widest text-center">รออัปโหลดภาพเหรียญ</span>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-6 space-y-8">
            <div className="inline-flex items-center gap-2 bg-[#FF6B1A]/10 text-[#FF6B1A] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              <Medal className="w-4 h-4" /> Finisher Edition 2026
            </div>
            <h2 className="text-5xl font-black italic tracking-tighter uppercase text-[#00CFCF] leading-tight">
              เหรียญที่ระลึกผู้พิชิต
            </h2>
            <p className="text-[#00CFCF]/80 leading-relaxed font-medium text-sm">
              เหรียญที่ระลึกสุโขทัยซีรีส์ (Sukhothai Signature Series) หล่อด้วยโลหะสังกะสีผสมพิเศษ (Zinc Alloy) เกรดพรีเมียมหนา 4 มม. ชุบผิวทองโบราณสไตล์แชมเปญแฮร์ไลน์สวยงาม สลักลวดลายฉลุวิจิตรศิลป์แห่งอาณาจักรสุโขทัยโบราณที่ออกแบบผสมผสานความร่วมสมัย
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => onRegisterClick("souvenir")}
                className="px-8 py-5 bg-[#FF6B1A] hover:bg-[#00CFCF] text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
              >
                สั่งซื้อของที่ระลึก (฿390) <ChevronRight className="w-5 h-5" />
              </button>
              <a
                href="#distances"
                onClick={(e) => {
                  e.preventDefault();
                  onRegisterClick();
                }}
                className="px-8 py-5 bg-transparent border-2 border-[#00CFCF] text-[#00CFCF] hover:bg-[#00CFCF] hover:text-white font-black uppercase tracking-widest text-sm rounded-xl transition-colors text-center flex items-center justify-center"
              >
                ตรวจสอบสิทธิ์
              </a>
            </div>
          </div>
        </section>

        {/* Info & Map Section */}
        <section className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-3xl font-black italic tracking-tighter text-[#00CFCF] flex items-center gap-3">
                <Award className="w-8 h-8 text-[#FF6B1A]" /> ข้อมูลการจัดกิจกรรม
              </h3>
              <div className="bg-[#00CFCF]/5 rounded-2xl p-6 border border-[#00CFCF]/10">
                <ul className="space-y-4 text-[#00CFCF]/80 text-sm font-medium">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#FF6B1A] shrink-0" />
                    <span>ผู้สมัครทุกประเภทจะได้รับประกันอุบัติเหตุ (คุ้มครองภายในวันงาน)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#FF6B1A] shrink-0" />
                    <span>บริการซุ้มน้ำดื่มทุกๆ ระยะ 2 กิโลเมตร และผลไม้บริเวณเส้นชัย</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#FF6B1A] shrink-0" />
                    <span>มีรถพยาบาลฉุกเฉินแสตนด์บายตลอดเวลา</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#FF6B1A] shrink-0" />
                    <span>รายได้สมทบกองทุนการศึกษา LSEd มธ.</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-[#FF6B1A]/10 rounded-2xl p-6 border border-[#FF6B1A]/20">
                <h4 className="text-sm font-black uppercase tracking-widest text-[#FF6B1A] flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" /> สิทธิ์ลดหย่อนภาษี
                </h4>
                <p className="text-sm text-[#00CFCF]/80 font-medium">
                  สำหรับผู้ที่ประสงค์สมทบทุน ท่านสามารถขอใช้สิทธิ์เพื่อลดหย่อนภาษีได้ โดยทางโครงการจะส่งมอบใบเสร็จ e-Donation ลดหย่อนภาษี 2 เท่าไปยังระบบของกรมสรรพากรโดยตรง
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-3xl font-black italic tracking-tighter text-[#00CFCF] flex items-center gap-3">
                <MapPin className="w-8 h-8 text-[#FF6B1A]" /> เส้นทางวิ่ง
              </h3>
              
              {routeMapImage ? (
                <div className="relative rounded-2xl overflow-hidden bg-[#00CFCF]/5 border border-[#00CFCF]/10 flex items-center justify-center p-2">
                  <img src={routeMapImage} alt="Route Map" className="w-full h-auto object-contain max-h-[500px] rounded-xl" />
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-[#00CFCF]/5 border border-[#00CFCF]/10 aspect-video flex items-center justify-center p-6">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-[#00CFCF]/30 mx-auto mb-3" />
                    <span className="text-[#00CFCF]/40 font-black uppercase tracking-widest text-sm">รออัปโหลดแผนที่เส้นทาง</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
`;

// Extract logic (everything before `return (`)
const logicPart = backup.substring(0, backup.indexOf('return ('));
const newComponent = logicPart + 'return (\n' + ui + '\n  );\n}\n';

fs.writeFileSync('src/components/LandingPage.tsx', newComponent);
console.log('Landing page rewritten completely.');
