"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Ticket,
  Plus,
  Printer,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api/auth";
import { eventApi } from "@/lib/api/event";
import { useModal } from "@/context/ModalContext";

interface TicketData {
  visitorId: number;
  entryCode: string;
  isActive: boolean;
}

export default function VisitorTicketsPage() {
  const params = useParams();
  const { showAlert } = useModal();
  const eventId = Number(params.eventId as string);

  const [userName, setUserName] = useState("관리자");
  const [eventName, setEventName] = useState("행사");
  const [quantity, setQuantity] = useState<number>(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isFetchingTickets, setIsFetchingTickets] = useState(false);

  const fetchTickets = async (pageNum: number) => {
    setIsFetchingTickets(true);
    try {
      const res = await eventApi.getVisitorTickets(eventId, pageNum, 30);
      if (res.data) {
        setTickets(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setPage(res.data.page);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setIsFetchingTickets(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [meRes, eventRes] = await Promise.all([
          authApi.getMe(),
          eventApi.getEvent(eventId.toString())
        ]);

        if (meRes.data?.success) setUserName(meRes.data.data.name);
        if (eventRes.data?.success) setEventName(eventRes.data.data.name);
        
        await fetchTickets(0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [eventId]);

  useEffect(() => {
    if (!isLoading) {
      fetchTickets(page);
    }
  }, [page]);

  const handleGenerate = async () => {
    if (quantity <= 0) {
      showAlert("생성할 티켓 수량을 입력해주세요.");
      return;
    }

    if (quantity > 9999) {
      showAlert("한 번에 최대 9,999매까지 생성 가능합니다.");
      setQuantity(9999);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await authApi.generateTickets({ eventId, quantity });
      if (res.data?.success) {
        setGeneratedAt(new Date().toLocaleString());
        showAlert(`${res.data.data.createdCount}개의 티켓이 성공적으로 생성되었습니다.`);
        setPage(0);
        await fetchTickets(0);
      }
    } catch (err: any) {
      showAlert(err.response?.data?.message || "티켓 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (tickets.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Use a grid of 3x4 or something similar for A4
    const ticketHtml = tickets.map(t => `
      <div class="ticket-card">
        <div class="ticket-header">
          <img src="/super/assets/logo.png" alt="Logo" class="logo" />
          <span class="event-name">${eventName}</span>
        </div>
        <div class="ticket-content">
          <div class="ticket-label">VISITOR ENTRY CODE</div>
          <div class="ticket-code">${t.entryCode}</div>
        </div>
        <div class="ticket-footer">
          <span>Visitor ID: ${t.visitorId}</span>
          <span>줄서잇(Julseoit)</span>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>방문자 티켓 출력 - ${eventName}</title>
          <style>
            @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
            
            @page { size: A4; margin: 10mm; }
            body { 
              font-family: 'Pretendard', sans-serif; 
              margin: 0; 
              padding: 0;
            }
            .page-container {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              width: 100%;
            }
            .ticket-card {
              border: 1.5px solid #000;
              padding: 15px;
              height: 180px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: white;
              position: relative;
              box-sizing: border-box;
            }
            .ticket-header {
              display: flex;
              align-items: center;
              gap: 8px;
              border-bottom: 1px solid #eee;
              padding-bottom: 8px;
            }
            .logo { height: 20px; width: auto; }
            .event-name { font-size: 10px; font-weight: 800; color: #2D2A4A; }
            
            .ticket-content {
              text-align: center;
              padding: 10px 0;
            }
            .ticket-label { font-size: 9px; color: #666; font-weight: 600; margin-bottom: 4px; }
            .ticket-code { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #000; }
            
            .ticket-footer {
              display: flex;
              justify-content: space-between;
              font-size: 8px;
              color: #999;
              border-top: 1px dashed #eee;
              padding-top: 8px;
            }
            
            @media print {
              .no-print { display: none; }
              .ticket-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            ${ticketHtml}
          </div>
          <script>
            window.onload = () => {
              window.print();
              // window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex bg-[#F1F3F5] h-screen overflow-hidden">
        <Sidebar userName={userName} role="총괄 팀장" eventId={eventId.toString()} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#2D2A4A]" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F1F3F5] h-screen overflow-hidden">
      <Sidebar userName={userName} role="총괄 팀장" eventId={eventId.toString()} />

      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#2D2A4A] p-2 rounded-xl shadow-lg">
                <Ticket className="w-6 h-6 text-[#C4FF00]" />
              </div>
              <h1 className="text-3xl font-black text-[#2D2A4A] tracking-tight">방문자 티켓 발급</h1>
            </div>
            <p className="text-gray-500 font-medium ml-1">오프라인 방문자를 위한 일회성 엔트리 코드를 생성하고 인쇄합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">
          {/* Generation Form */}
          <div className="lg:col-span-1">
            <Card className="p-8 border-0 shadow-sm bg-white rounded-[32px] sticky top-0">
              <div className="flex items-center gap-2 mb-8">
                <Plus className="w-5 h-5 text-[#2D2A4A]" />
                <h2 className="text-xl font-bold text-[#2D2A4A]">티켓 일괄 생성</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="quantity" className="text-sm font-bold text-gray-700 ml-1">생성할 수량</Label>
                  <div className="relative">
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity === 0 ? "" : quantity}
                      onChange={(e) => {
                        const inputVal = e.target.value;
                        if (inputVal.length > 4) {
                          showAlert("최대 4자리(9,999매)까지만 입력 가능합니다.");
                          return;
                        }
                        const numVal = Number(inputVal);
                        if (numVal > 9999) {
                          showAlert("최대 9,999매까지 생성 가능합니다.");
                          setQuantity(9999);
                        } else {
                          setQuantity(numVal);
                        }
                      }}
                      max={9999}
                      min={1}
                      className={cn(
                        "h-14 bg-[#F8F9FA] border-0 rounded-2xl px-6 text-lg font-bold focus:ring-2 transition-all shadow-inner",
                        quantity >= 9999 ? "text-red-500 ring-2 ring-red-500 bg-red-50" : "text-[#2D2A4A] focus:ring-[#2D2A4A]/10"
                      )}
                      placeholder="예: 5000"
                    />
                    <div className={cn(
                      "absolute right-6 top-1/2 -translate-y-1/2 font-black transition-colors",
                      quantity >= 9999 ? "text-red-500" : "text-gray-400"
                    )}>매</div>
                  </div>
                  <p className={cn(
                    "text-xs ml-1 transition-colors",
                    quantity >= 9999 ? "text-red-500 font-bold" : "text-gray-400"
                  )}>
                    한 번에 최대 9,999매까지 생성이 권장됩니다.
                  </p>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || quantity <= 0}
                  className="w-full h-16 bg-[#2D2A4A] hover:bg-[#1a1836] text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#2D2A4A]/20 active:scale-95 disabled:opacity-50 group"
                >
                  {isGenerating ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Ticket className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                      티켓 생성하기
                    </>
                  )}
                </Button>
              </div>

              {generatedAt && (
                <div className="mt-8 p-4 bg-emerald-50 rounded-2xl flex items-start gap-3 border border-emerald-100 animate-in slide-in-from-bottom-2 duration-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">최근 생성 완료</p>
                    <p className="text-xs text-emerald-600 mt-0.5">{generatedAt}</p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Ticket List */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-[700px] border-0 shadow-sm bg-white rounded-[40px] overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#2D2A4A]">생성된 티켓 목록</h2>
                  <p className="text-sm text-gray-400 mt-1">총 {totalElements}개의 티켓이 발급되었습니다.</p>
                </div>

                {tickets.length > 0 && (
                  <Button
                    onClick={handlePrint}
                    className="bg-[#C4FF00] hover:bg-[#b5eb00] text-[#2D2A4A] px-6 h-12 rounded-xl font-black shadow-lg shadow-[#C4FF00]/20 transition-all active:scale-95 flex gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    티켓 일괄 인쇄
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isFetchingTickets ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#2D2A4A]/20" />
                  </div>
                ) : tickets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.visitorId}
                        className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-100 group hover:border-[#2D2A4A]/20 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-[#2D2A4A] shadow-sm text-xs">
                              {ticket.visitorId}
                            </div>
                            <div className="text-[15px] font-black text-gray-800 tracking-widest">
                              {ticket.entryCode}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {ticket.isActive ? (
                              <span className="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-emerald-500 shadow-sm border border-emerald-50">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-rose-500 shadow-sm border border-rose-50">
                                INACTIVE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <Ticket className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400">생성된 티켓이 없습니다.</h3>
                    <p className="text-sm text-gray-300 mt-2">왼쪽 폼에서 수량을 입력하고 생성 버튼을 눌러주세요.</p>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="px-8 py-4 border-t border-gray-50 flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPage(prev => Math.max(0, prev - 1))}
                    disabled={page === 0 || isFetchingTickets}
                    className="rounded-xl hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Adjust to show page numbers around current page
                      let pageNum = i;
                      if (totalPages > 5) {
                        if (page > 2) pageNum = page - 2 + i;
                        if (pageNum >= totalPages) pageNum = totalPages - 5 + i;
                        if (pageNum < 0) pageNum = i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "ghost"}
                          onClick={() => setPage(pageNum)}
                          disabled={isFetchingTickets}
                          className={`w-10 h-10 rounded-xl font-bold ${
                            page === pageNum 
                              ? "bg-[#2D2A4A] text-white hover:bg-[#2D2A4A]" 
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={page === totalPages - 1 || isFetchingTickets}
                    className="rounded-xl hover:bg-gray-100"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {tickets.length > 0 && (
                <div className="p-6 bg-[#F8F9FA] border-t border-gray-50">
                  <p className="text-[11px] text-gray-400 text-center font-medium">
                    주의: 생성된 티켓 코드는 일회용이며, 인쇄 후 방문자에게 배포하시기 바랍니다.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }

        /* Hide number input spinners */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
