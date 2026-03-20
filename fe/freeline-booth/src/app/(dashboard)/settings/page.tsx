"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { Printer, RefreshCw, Save, QrCode } from "lucide-react";
import { getBoothInfo, updateBooth, BoothUpdateRequest } from "@/lib/api/booth";
import { getQR, generateQR, reissueQR, QRData } from "@/lib/api/qr";

const DEFAULT_BOOTH_ID = 12; // In a real app, this would come from auth context/session

export default function SettingsPage() {
  const [boothId] = useState(DEFAULT_BOOTH_ID);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Booth Info State
  const [boothInfo, setBoothInfo] = useState<BoothUpdateRequest>({
    name: "",
    locationCode: "",
    openTime: "10:00",
    closeTime: "19:00",
  });

  // QR Info State
  const [qrData, setQrData] = useState<QRData | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, [boothId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [boothRes, qrRes] = await Promise.all([
        getBoothInfo(boothId),
        getQR(boothId).catch(() => null), // QR might not exist yet
      ]);

      if (boothRes.success) {
        setBoothInfo({
          name: boothRes.data.name,
          locationCode: boothRes.data.locationCode,
          openTime: boothRes.data.openTime,
          closeTime: boothRes.data.closeTime,
        });
      }

      if (qrRes && qrRes.success) {
        setQrData(qrRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoothUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateBooth(boothId, boothInfo);
      if (res.success) {
        alert("부스 정보가 성공적으로 수정되었습니다.");
      }
    } catch (error) {
      console.error("Failed to update booth:", error);
      alert("부스 정보 수정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      const res = await generateQR(boothId);
      if (res.success) {
        setQrData(res.data);
        alert("QR 코드가 생성되었습니다.");
      }
    } catch (error) {
      console.error("Failed to generate QR:", error);
      alert("QR 코드 생성에 실패했습니다.");
    }
  };

  const handleReissueQR = async () => {
    if (!confirm("QR 코드를 재발급하시겠습니까? 기존 QR 코드는 더 이상 사용할 수 없습니다.")) return;
    try {
      const res = await reissueQR(boothId);
      if (res.success) {
        setQrData(res.data);
        alert("QR 코드가 재발급되었습니다.");
      }
    } catch (error) {
      console.error("Failed to reissue QR:", error);
      alert("QR 코드 재발급에 실패했습니다.");
    }
  };

  const handlePrint = () => {
    if (!qrData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrSvg = document.getElementById('qr-code-svg')?.outerHTML || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>부스 QR 코드 출력</title>
          <style>
            body { font-family: 'Pretendard', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { border: 2px solid #2D2A4A; padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; }
            .booth-name { font-size: 28px; font-weight: bold; margin-bottom: 20px; color: #2D2A4A; }
            .qr-wrapper { margin-bottom: 20px; }
            .instruction { font-size: 16px; color: #666; }
            @media print {
              body { height: auto; }
              .container { border: none; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="booth-name">${boothInfo.name}</div>
            <div class="qr-wrapper">
              ${qrSvg}
            </div>
            <div class="instruction">Scan to Join Queue</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg font-medium text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">환경 설정</h1>
        <p className="text-gray-500 mt-1">부스 정보와 QR 코드를 관리합니다.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Booth Information Section */}
        <section className="space-y-6">
          <Card className="p-6 border-0 shadow-sm bg-white rounded-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Save className="h-5 w-5 text-[#2D2A4A]" />
              <h2 className="text-xl font-bold text-gray-900">부스 정보 수정</h2>
            </div>

            <form onSubmit={handleBoothUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="boothName">부스 명칭</Label>
                <Input
                  id="boothName"
                  value={boothInfo.name}
                  onChange={(e) => setBoothInfo({ ...boothInfo, name: e.target.value })}
                  placeholder="SSAFY 공식 굿즈 부스"
                  className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationCode">위치 코드</Label>
                <Input
                  id="locationCode"
                  value={boothInfo.locationCode}
                  onChange={(e) => setBoothInfo({ ...boothInfo, locationCode: e.target.value })}
                  placeholder="A-05"
                  className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openTime">오픈 시간</Label>
                  <Input
                    id="openTime"
                    type="time"
                    value={boothInfo.openTime}
                    onChange={(e) => setBoothInfo({ ...boothInfo, openTime: e.target.value })}
                    className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closeTime">마감 시간</Label>
                  <Input
                    id="closeTime"
                    type="time"
                    value={boothInfo.closeTime}
                    onChange={(e) => setBoothInfo({ ...boothInfo, closeTime: e.target.value })}
                    className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full h-12 bg-[#2D2A4A] text-white font-bold rounded-xl mt-4 hover:bg-[#3A375C] transition-all"
              >
                {isSaving ? "저장 중..." : "정보 저장"}
              </Button>
            </form>
          </Card>
        </section>

        {/* QR Management Section */}
        <section className="space-y-6">
          <Card className="p-6 border-0 shadow-sm bg-white rounded-2xl h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <QrCode className="h-5 w-5 text-[#2D2A4A]" />
              <h2 className="text-xl font-bold text-gray-900">부스 QR 관리</h2>
            </div>

            {qrData ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-4">
                <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-inner">
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={qrData.qrCode}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-gray-900">상태: <span className="text-emerald-500">{qrData.status}</span></p>
                  <p className="text-xs text-gray-400">발급일: {new Date(qrData.issuedAt).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">만료일: {new Date(qrData.expiresAt).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full pt-4">
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="h-12 border-2 border-gray-100 rounded-xl font-bold flex gap-2 hover:bg-gray-50 transition-all"
                  >
                    <Printer className="h-5 w-5" />
                    QR 출력
                  </Button>
                  <Button
                    onClick={handleReissueQR}
                    variant="outline"
                    className="h-12 border-2 border-[#2D2A4A]/10 text-gray-600 rounded-xl font-bold flex gap-2 hover:bg-gray-50 transition-all"
                  >
                    <RefreshCw className="h-4 w-4" />
                    QR 재발급
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-gray-300" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-gray-900">생성된 QR 코드가 없습니다.</p>
                  <p className="text-sm text-gray-400">현장 대기 등록을 위해 QR 코드를 생성하세요.</p>
                </div>
                <Button
                  onClick={handleGenerateQR}
                  className="h-12 px-8 bg-[#D9F950] text-[#2D2A4A] font-extrabold rounded-xl hover:bg-[#c9e843] transition-all"
                >
                  QR 코드 생성하기
                </Button>
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
