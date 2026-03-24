"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, BarChart3, Download } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { SummaryCards } from "@/components/report/SummaryCards";
import { HourlyTrafficChart } from "@/components/report/HourlyTrafficChart";
import { BoothPerformanceTable } from "@/components/report/BoothPerformanceTable";
import { VisitorPaths } from "@/components/report/VisitorPaths";
import { ProblemSpots } from "@/components/report/ProblemSpots";
import { ReportGenerator } from "@/components/report/ReportGenerator";
import { reportApi, ReportResponseDto } from "@/lib/api/report";
import { eventApi, Event } from "@/lib/api/event";
import { authApi } from "@/lib/api/auth";

export default function ReportPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [report, setReport] = useState<ReportResponseDto | null>(null);
  const [userName, setUserName] = useState("관리자");
  const [isLoading, setIsLoading] = useState(true);
  const [hasReport, setHasReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchReport = useCallback(async () => {
    try {
      const res = await reportApi.getEventReport(eventId);
      if (res.data?.success && res.data?.data) {
        setReport(res.data.data);
        setHasReport(true);
      }
    } catch {
      setHasReport(false);
    }
  }, [eventId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const userRes = await authApi.getMe();
        if (userRes.data?.success && userRes.data?.data?.name) {
          setUserName(userRes.data.data.name);
        }

        const eventRes = await eventApi.getEvent(eventId);
        let detail = null;
        if (eventRes.data?.success && eventRes.data?.data) {
          detail = eventRes.data.data;
        } else if (eventRes.data && (eventRes.data as any).eventId) {
          detail = eventRes.data;
        }
        if (detail) {
          setEvent(detail as Event);
        }

        await fetchReport();
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) fetchData();
  }, [eventId, fetchReport]);

  const handleReportComplete = () => {
    fetchReport();
  };

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#F1F3F5",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // A4 landscape for wider dashboard layout
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      // If content is taller than one page, paginate
      if (scaledHeight > pdfHeight) {
        const pageCanvasHeight = (pdfHeight / ratio);
        let yOffset = 0;
        let pageNum = 0;

        while (yOffset < imgHeight) {
          if (pageNum > 0) pdf.addPage();

          const sliceHeight = Math.min(pageCanvasHeight, imgHeight - yOffset);

          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = imgWidth;
          pageCanvas.height = sliceHeight;
          const ctx = pageCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, yOffset, imgWidth, sliceHeight,
              0, 0, imgWidth, sliceHeight,
            );
          }

          const pageImgData = pageCanvas.toDataURL("image/png");
          const pageScaledHeight = sliceHeight * ratio;
          pdf.addImage(pageImgData, "PNG", 0, 0, pdfWidth, pageScaledHeight);

          yOffset += sliceHeight;
          pageNum++;
        }
      } else {
        const x = (pdfWidth - scaledWidth) / 2;
        const y = 0;
        pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);
      }

      const fileName = `${event?.name || "행사"}_리포트_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF 다운로드에 실패했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F3F5]">
        <Loader2 className="w-12 h-12 animate-spin text-[#2D2A4A]" />
      </div>
    );
  }

  return (
    <div className="flex bg-[#F1F3F5] h-screen overflow-hidden">
      <Sidebar userName={userName} role="총괄 팀장" eventId={eventId} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-[#2D2A4A] rounded-xl">
              <BarChart3 className="w-5 h-5 text-[#C4FF00]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">분석 리포트</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {event?.name || "행사"} 분석 결과
              </p>
            </div>

            {/* PDF Download Button */}
            {hasReport && report && (
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-[#2D2A4A] text-white rounded-xl font-bold text-sm hover:bg-[#3A375C] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? "PDF 생성 중..." : "PDF 다운로드"}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 pb-12">
          {hasReport && report ? (
            <div ref={reportRef} className="space-y-6 max-w-[1200px]">
              {/* Summary */}
              <SummaryCards summary={report.summary} />

              {/* Hourly Chart */}
              <HourlyTrafficChart data={report.hourlyTraffics} />

              {/* Two-column: Booth Performance + Problem Spots */}
              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-3">
                  <BoothPerformanceTable data={report.boothPerformances} />
                </div>
                <div className="col-span-2">
                  <ProblemSpots data={report.problemSpots} />
                </div>
              </div>

              {/* Visitor Paths */}
              <VisitorPaths data={report.visitorPaths} />
            </div>
          ) : (
            <div className="max-w-[1200px] bg-white rounded-[32px] shadow-sm border border-gray-100">
              <ReportGenerator
                eventId={eventId}
                eventStatus={event?.status || ""}
                onComplete={handleReportComplete}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
