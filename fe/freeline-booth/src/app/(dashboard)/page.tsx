"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { 
  PauseCircle, 
  XCircle, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Bell,
  LogOut,
  RefreshCcw,
  Wifi,
  WifiOff
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { waitingApi, WaitingInfo, DashboardResponse } from "@/lib/api/waiting";
import { getBoothPolicy, BoothPolicy } from "@/lib/api/booth";
import { useWaitingSSE } from "@/hooks/useWaitingSSE";

type TabStatus = 'WAITING' | 'ENTERED' | 'CANCELLED';

// Helper component for countdown timer to avoid rerendering the entire dashboard
function CountdownTimer({ enteredAt, staySeconds }: { enteredAt: string, staySeconds: number }) {
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  useEffect(() => {
    const calculate = () => {
      const entryTime = new Date(enteredAt).getTime();
      const now = Date.now();
      const elapsedSec = Math.floor((now - entryTime) / 1000);
      setRemainingSec(staySeconds - elapsedSec);
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [enteredAt, staySeconds]);

  if (remainingSec === null) return null;

  const isOvertime = remainingSec <= 0;
  const absRem = Math.abs(remainingSec);
  const min = Math.floor(absRem / 60);
  const sec = absRem % 60;
  const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

  return (
    <div className={`flex flex-col ${isOvertime ? 'text-rose-500' : 'text-emerald-500'}`}>
      <span className="text-[10px] font-black uppercase tracking-widest">{isOvertime ? '시간 초과' : '이용 시간'}</span>
      <span className="text-sm font-black tracking-tight">
        {isOvertime ? `초과 이용 중: ${timeStr}` : `남은 시간: ${timeStr}`}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardResponse['data'] | null>(null);
  const [fullQueue, setFullQueue] = useState<WaitingInfo[]>([]);
  const [activeTab, setActiveTab] = useState<TabStatus>('WAITING');
  const [isLoading, setIsLoading] = useState(true);
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [boothPolicy, setBoothPolicy] = useState<BoothPolicy | null>(null);

  const fetchData = useCallback(async (showLoading = false) => {
    if (!user?.boothId) return;
    if (showLoading) setIsLoading(true);
    setIsDataFetching(true);
    try {
      const [dashRes, queueRes, policyRes] = await Promise.all([
        waitingApi.getDashboard(user.boothId),
        waitingApi.getQueue(),
        getBoothPolicy(user.boothId)
      ]);

      if (dashRes.success && dashRes.data) {
        setDashboardData(dashRes.data);
      }
      
      if (queueRes.success && queueRes.data) {
        setFullQueue(queueRes.data.queueList || []);
      }

      if (policyRes.success && policyRes.data) {
        setBoothPolicy(policyRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard or queue data:", error);
    } finally {
      setIsLoading(false);
      setIsDataFetching(false);
    }
  }, [user?.boothId]);

  useEffect(() => {
    if (user?.boothId) {
      fetchData(true);
      
      // Setup Polling every 10 seconds as a fallback/alternative for SSE
      const interval = setInterval(() => {
        console.log("[Polling] Refreshing data...");
        fetchData(false);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.boothId, fetchData]);

  // SSE Real-time updates (if connection works)
  const { isConnected } = useWaitingSSE(user?.boothId, () => {
    console.log("[SSE] Triggering data refresh");
    fetchData(false);
  });

  const handleCall = async () => {
    if (!user?.boothId) return;
    try {
      await waitingApi.callNext(user.boothId);
      alert("다음 대기자를 호출했습니다.");
      fetchData(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "호출에 실패했습니다.");
    }
  };

  const handleAdmit = async (waitingId: number) => {
    if (!user?.boothId) return;
    try {
      await waitingApi.admitWaiting(user.boothId, waitingId);
      fetchData(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "입장 처리에 실패했습니다.");
    }
  };

  const handleCancel = async (waitingId: number) => {
    if (!user?.boothId) return;
    if (!confirm("정말 이 대기를 취소하시겠습니까?")) return;
    try {
      await waitingApi.cancelWaiting(user.boothId, waitingId);
      fetchData(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "취소 처리에 실패했습니다.");
    }
  };

  const handleExit = async (waitingId: number) => {
    if (!user?.boothId) return;
    try {
      await waitingApi.exitWaiting(user.boothId, waitingId);
      fetchData(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "퇴장 처리에 실패했습니다.");
    }
  };

  const handlePostpone = async (waitingId: number) => {
    try {
      await waitingApi.postponeWaiting(waitingId);
      fetchData(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "미루기 처리에 실패했습니다.");
    }
  };

  const calculatedCount = {
    waiting: fullQueue.filter(w => w.status === 'REGISTERED' || w.status === 'WAITING' || w.status === 'CALLED').length,
    inUse: fullQueue.filter(w => w.status === 'ENTERED').length,
  };
  const totalActive = calculatedCount.waiting + calculatedCount.inUse;

  const filteredQueue = fullQueue.filter(w => {
    if (activeTab === 'WAITING') return w.status === 'REGISTERED' || w.status === 'WAITING' || w.status === 'CALLED';
    if (activeTab === 'ENTERED') return w.status === 'ENTERED' || w.status === 'EXITED'; 
    if (activeTab === 'CANCELLED') return w.status === 'CANCELLED';
    return false;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full flex flex-col text-black">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black tracking-tight text-gray-900">실시간 대기 현황</h1>
            {dashboardData?.booth?.emergencyClosed && (
              <span className="px-2 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg animate-pulse">비상 마감</span>
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg">
               {isConnected ? (
                 <Wifi className="w-3 h-3 text-emerald-500" />
               ) : (
                 <WifiOff className="w-3 h-3 text-amber-500" />
               )}
               <span className={`text-[10px] font-black ${isConnected ? 'text-emerald-700' : 'text-amber-700'}`}>
                 {isConnected ? '실시간 연결됨' : '자동 갱신 중'}
               </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 w-fit">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-emerald-700">
               {dashboardData?.booth?.boothName || "부스"} · {dashboardData?.booth?.locationCode || "위치 코드 없음"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-3 mr-4">
             <div className="flex flex-col items-center justify-center px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">대기+입장</span>
                <span className="text-xl font-black text-gray-900">{totalActive}</span>
             </div>
             <div className="flex flex-col items-center justify-center px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">부스 체험 중</span>
                <span className="text-xl font-black text-gray-900">{calculatedCount.inUse}</span>
             </div>
          </div>

          <button 
            onClick={() => fetchData(true)}
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
            title="새로고침"
          >
            <RefreshCcw className={`w-6 h-6 text-gray-400 ${isDataFetching ? 'animate-spin' : ''}`} />
          </button>

          <button className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-amber-500 px-6 font-black text-white shadow-lg shadow-amber-500/20 transition-all duration-300 hover:-translate-y-1 hover:bg-amber-600 active:translate-y-0">
            <PauseCircle className="h-6 w-6" />
            <span>운영중지</span>
          </button>
          
          <button className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-rose-500 px-6 font-black text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:-translate-y-1 hover:bg-rose-600 active:translate-y-0">
            <XCircle className="h-6 w-6" />
            <span>운영종료</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        {/* Tabs and Call Next Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="inline-flex h-14 items-center justify-center rounded-[20px] bg-white p-1.5 shadow-sm border border-gray-100">
            <button 
              onClick={() => setActiveTab('WAITING')}
              className={`inline-flex h-full items-center justify-center rounded-[14px] px-8 text-sm font-black transition-all duration-300 ${
                activeTab === 'WAITING' 
                ? "bg-[#2D2A4A] text-white shadow-lg shadow-[#2D2A4A]/20" 
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              대기 {calculatedCount.waiting}
            </button>
            <button 
              onClick={() => setActiveTab('ENTERED')}
              className={`inline-flex h-full items-center justify-center rounded-[14px] px-8 text-sm font-black transition-all duration-300 ${
                activeTab === 'ENTERED' 
                ? "bg-[#2D2A4A] text-white shadow-lg shadow-[#2D2A4A]/20" 
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              입장 {calculatedCount.inUse}
            </button>
            <button 
              onClick={() => setActiveTab('CANCELLED')}
              className={`inline-flex h-full items-center justify-center rounded-[14px] px-8 text-sm font-black transition-all duration-300 ${
                activeTab === 'CANCELLED' 
                ? "bg-[#2D2A4A] text-white shadow-lg shadow-[#2D2A4A]/20" 
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              취소
            </button>
          </div>

          {activeTab === 'WAITING' && (dashboardData?.summary?.waitingCount || fullQueue.length) > 0 && (
            <button 
              onClick={handleCall}
              className="group flex h-14 items-center gap-3 px-8 rounded-2xl bg-lime-400 hover:bg-lime-500 text-[#2D2A4A] font-black transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-lime-400/20"
            >
              <Bell className="w-5 h-5 group-hover:animate-bounce" />
              다음 대기자 호출
            </button>
          )}
        </div>

        {/* List Content */}
        {isLoading && fullQueue.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-bold">대기열을 불러오는 중...</div>
        ) : filteredQueue.length === 0 ? (
          <div className="flex-1 bg-white/50 border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center text-gray-400">
            <div className="p-6 bg-gray-50 rounded-full mb-4">
              <User className="w-12 h-12 text-gray-300" />
            </div>
            <p className="text-xl font-bold">목록이 비어있습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQueue.map((waiting) => (
              <Card key={waiting.waitingId} className="relative overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 group rounded-[28px] bg-white p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-xl font-black text-gray-900 group-hover:bg-[#2D2A4A] group-hover:text-white transition-colors duration-300">
                      {waiting.waitingNumber}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 max-w-[120px] truncate">{waiting.visitorName}</h3>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-bold tracking-tight">
                           {waiting.registeredAt ? new Date(waiting.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {waiting.status === 'CALLED' && (
                      <div className="px-3 py-1 bg-amber-50 rounded-full border border-amber-100 flex items-center gap-1.5 animate-pulse">
                        <Bell className="w-3 h-3 text-amber-600" />
                        <span className="text-[10px] font-black text-amber-700 tracking-tighter uppercase">호출됨</span>
                      </div>
                    )}
                    {(waiting.status === 'REGISTERED' || waiting.status === 'WAITING') && (
                      <div className="px-3 py-1 bg-lime-50 rounded-full border border-lime-100 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-lime-600" />
                        <span className="text-[10px] font-black text-lime-700 tracking-tighter uppercase">대기</span>
                      </div>
                    )}
                    {(waiting.status === 'ENTERED' || waiting.status === 'EXITED') && (
                      <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 tracking-tighter uppercase">부스 체험 중</span>
                      </div>
                    )}
                    {waiting.status === 'CANCELLED' && (
                      <div className="px-3 py-1 bg-rose-50 rounded-full border border-rose-100 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span className="text-[10px] font-black text-rose-700 tracking-tighter uppercase">취소됨</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl mb-6 group-hover:bg-gray-100 transition-colors">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm">
                    {waiting.status === 'ENTERED' ? (
                      <Clock className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    {waiting.status === 'ENTERED' && waiting.enteredAt && boothPolicy ? (
                      <CountdownTimer 
                        enteredAt={waiting.enteredAt} 
                        staySeconds={boothPolicy.staySeconds} 
                      />
                    ) : (
                      <>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">도착 인증</span>
                        <span className={`text-xs font-black ${
                          waiting.arrivalChecked ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          {waiting.arrivalChecked 
                            ? '도착 인증' 
                            : waiting.status === 'CALLED' 
                              ? '호출 완료' 
                              : '도착 전'
                          }
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {activeTab === 'WAITING' && (
                    <>
                      <button 
                        onClick={() => handleAdmit(waiting.waitingId)}
                        className="h-12 flex items-center justify-center gap-2 rounded-xl bg-lime-400 hover:bg-lime-500 font-black text-[#2D2A4A] transition-all text-sm"
                      >
                        입장 처리
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handlePostpone(waiting.waitingId)}
                          className="h-12 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-600 transition-all text-xs"
                          title="미루기"
                        >
                          미루기
                        </button>
                        <button 
                          onClick={() => handleCancel(waiting.waitingId)}
                          className="h-12 flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 font-black text-rose-500 transition-all text-xs"
                          title="취소"
                        >
                          취소
                        </button>
                      </div>
                    </>
                  )}
                  {activeTab === 'ENTERED' && (
                    <button 
                      onClick={() => handleExit(waiting.waitingId)}
                      className="col-span-2 h-12 flex items-center justify-center gap-2 rounded-xl bg-gray-900 hover:bg-black font-black text-white transition-all text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      퇴장 처리
                    </button>
                  )}
                  {activeTab === 'CANCELLED' && (
                    <div className="col-span-2 py-3 text-center text-gray-400 font-bold text-sm bg-gray-50 rounded-xl">
                      취소된 예약입니다
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
