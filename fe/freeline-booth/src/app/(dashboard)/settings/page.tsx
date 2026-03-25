"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { Printer, RefreshCw, Save, QrCode, Settings, Image as ImageIcon, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getBoothInfo,
  updateBooth,
  BoothUpdateRequest,
  BoothPolicy,
  getBoothPolicy,
  updateBoothPolicy,
  uploadBoothImage,
  uploadRepresentativeImage,
  getBoothImages
} from "@/lib/api/booth";
import { getQR, generateQR, reissueQR, QRData } from "@/lib/api/qr";
import {useAuth} from "@/context/AuthContext";

type TabType = 'info' | 'policy' | 'qr';

export default function SettingsPage() {
  const {user, isLoading: authLoading} = useAuth();
  const boothId = user?.boothId || 0;
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingRepImage, setIsUploadingRepImage] = useState(false);

  // File states for preview
  const [repImageFile, setRepImageFile] = useState<File | null>(null);
  const [repImagePreview, setRepImagePreview] = useState<string | null>(null);
  const [logoImageFile, setLogoImageFile] = useState<File | null>(null);
  const [logoImagePreview, setLogoImagePreview] = useState<string | null>(null);

  const repImageInputRef = useRef<HTMLInputElement>(null);
  const logoImageInputRef = useRef<HTMLInputElement>(null);

  // Booth Info State
  const [boothInfo, setBoothInfo] = useState<BoothUpdateRequest>({
    name: "",
    locationCode: "",
    openTime: "10:00",
    closeTime: "19:00",
  });

  // Policy Info State
  const [policyInfo, setPolicyInfo] = useState<BoothPolicy>({
    staySeconds: 600,
    maxWaitingCount: 100,
    callCount: 5,
    callValidSeconds: 300,
    deferLimit: 3,
  });

  // QR Info State
  const [qrData, setQrData] = useState<QRData | null>(null);

  useEffect(() => {
    if (boothId) {
      fetchInitialData();
    }

    // Cleanup Object URLs to avoid memory leaks
    return () => {
      // Only cleanup local blobs, not backend URLs
      if (repImagePreview?.startsWith('blob:')) URL.revokeObjectURL(repImagePreview);
      if (logoImagePreview?.startsWith('blob:')) URL.revokeObjectURL(logoImagePreview);
    };
  }, [boothId]);

  const fetchInitialData = async () => {
    if (!boothId) return;
    setIsLoading(true);
    try {
      const [boothRes, qrRes, policyRes, imagesRes] = await Promise.all([
        getBoothInfo(boothId),
        getQR(boothId).catch(() => null),
        getBoothPolicy(boothId).catch(() => null),
        getBoothImages(boothId).catch(() => null),
      ]);

      if (boothRes.success && boothRes.data) {
        setBoothInfo({
          name: boothRes.data.name || "",
          locationCode: boothRes.data.locationCode || "",
          openTime: (boothRes.data.openTime || "10:00").substring(0, 5),
          closeTime: (boothRes.data.closeTime || "19:00").substring(0, 5),
        });
      }

      if (qrRes && qrRes.success) {
        setQrData(qrRes.data);
      }

      if (policyRes && policyRes.success) {
        setPolicyInfo({
          staySeconds: policyRes.data.staySeconds,
          maxWaitingCount: policyRes.data.maxWaitingCount,
          callCount: policyRes.data.callCount,
          callValidSeconds: policyRes.data.callValidSeconds,
          deferLimit: policyRes.data.deferLimit,
        });
      }

      // Handle images persistence
      if (imagesRes && imagesRes.success && imagesRes.data) {
        const repImage = imagesRes.data.find(img => img.isRepresentative);
        const logoImage = imagesRes.data.find(img => !img.isRepresentative);

        if (repImage) setRepImagePreview(repImage.imageUri);
        if (logoImage) setLogoImagePreview(logoImage.imageUri);
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

  const handlePolicyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    try {
      const res = await updateBoothPolicy(boothId, policyInfo);
      if (res.success) {
        alert("부스 정책이 성공적으로 수정되었습니다.");
      }
    } catch (error) {
      console.error("Failed to update policy:", error);
      alert("부스 정책 수정에 실패했습니다.");
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isRep: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cleanup previous object URL if it was a blob
    const prevPreview = isRep ? repImagePreview : logoImagePreview;
    if (prevPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(prevPreview);
    }

    const url = URL.createObjectURL(file);
    if (isRep) {
      setRepImageFile(file);
      setRepImagePreview(url);
    } else {
      setLogoImageFile(file);
      setLogoImagePreview(url);
    }
  };

  const handleImageUploadSubmit = async (isRep: boolean) => {
    const file = isRep ? repImageFile : logoImageFile;
    if (!file) {
      alert("업로드할 파일을 선택해주세요.");
      return;
    }

    if (isRep) {
      setIsUploadingRepImage(true);
      try {
        const res = await uploadRepresentativeImage(boothId, file);
        if (res.success) {
          alert("대표 이미지가 성공적으로 업로드되었습니다.");
          setRepImageFile(null);
          // Optional: re-fetch images to get server URL instead of blob
        }
      } catch (error) {
        console.error("Failed to upload representative image:", error);
        alert("대표 이미지 업로드에 실패했습니다.");
      } finally {
        setIsUploadingRepImage(false);
      }
    } else {
      setIsUploadingImage(true);
      try {
        const res = await uploadBoothImage(boothId, file);
        if (res.success) {
          alert("로고 이미지가 성공적으로 업로드되었습니다.");
          setLogoImageFile(null);
          // Optional: re-fetch images to get server URL instead of blob
        }
      } catch (error) {
        console.error("Failed to upload image:", error);
        alert("로고 이미지 업로드에 실패했습니다.");
      } finally {
        setIsUploadingImage(false);
      }
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

    // Default or fetched images
    const eventImageUrl = (boothInfo as any).eventImageUrl || repImagePreview || '';
    const logoUrl = (boothInfo as any).logoUrl || logoImagePreview || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>부스 QR 코드 출력</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { 
              font-family: 'Pretendard', sans-serif; 
              margin: 0; 
              padding: 0; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              background-color: #111;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .poster-container {
              width: 100%;
              height: 100vh;
              position: relative;
              padding: 40px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              background-color: #1a1a1a;
              ${eventImageUrl
        ? "background-image: url('" + eventImageUrl + "'); background-size: cover; background-position: center;"
        : "background-image: radial-gradient(#333 15%, transparent 16%); background-size: 20px 20px;"}
            }
            .qr-box {
              background: #e5e7eb;
              width: 60%;
              aspect-ratio: 1 / 1;
              margin-top: 10vh;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 24px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            .qr-box svg {
              width: 100%;
              height: 100%;
            }
            .info-row {
              display: flex;
              width: 60%;
              gap: 20px;
              margin-top: 20px;
            }
            .info-box {
              flex: 1;
              background: #e5e7eb;
              padding: 20px 10px;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #000;
              box-shadow: 0 5px 15px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 80px;
              word-break: keep-all;
            }
            .logo-box {
              width: 60%;
              height: 120px;
              background: #e5e7eb;
              margin-top: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              box-shadow: 0 5px 15px rgba(0,0,0,0.3);
              overflow: hidden;
            }
            .logo-box img {
              max-width: 90%;
              max-height: 90%;
              object-fit: contain;
            }
            .empty-logo {
              color: #000;
              font-size: 24px;
              font-weight: bold;
            }
            @media print {
              body { height: auto; }
              .poster-container {
                height: 100vh;
                page-break-after: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="poster-container">
            <div class="qr-box">
              ${qrSvg}
            </div>
            <div class="info-row">
              <div class="info-box">${boothInfo.name || '회사 이름'}</div>
              <div class="info-box">${boothInfo.locationCode || '부스 위치'}</div>
            </div>
            <div class="logo-box">
              ${logoUrl ? "<img src='" + logoUrl + "' alt='회사 로고' />" : "<span class='empty-logo'>회사 로고</span>"}
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => { window.close(); }, 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (authLoading || (isLoading && boothId)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg font-medium text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!boothId && !authLoading) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <div className="text-lg font-medium text-red-400">부스 정보를 찾을 수 없습니다.</div>
          <Button
              onClick={() => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("boothId");
                window.location.href = "/login";
              }}
              className="bg-[#2D2A4A] text-white"
          >
            다시 로그인하기
          </Button>
        </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">환경 설정</h1>
        <p className="text-gray-500 mt-1">부스 정보, 정책 설정 및 QR 코드를 관리합니다.</p>
      </header>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('info')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-colors relative",
            activeTab === 'info' ? "text-[#2D2A4A]" : "text-gray-400 hover:text-gray-600"
          )}
        >
          부스 기본정보
          {activeTab === 'info' && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2D2A4A] rounded-t-xl" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-colors relative",
            activeTab === 'policy' ? "text-[#2D2A4A]" : "text-gray-400 hover:text-gray-600"
          )}
        >
          부스 운영정책
          {activeTab === 'policy' && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2D2A4A] rounded-t-xl" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-colors relative",
            activeTab === 'qr' ? "text-[#2D2A4A]" : "text-gray-400 hover:text-gray-600"
          )}
        >
          부스 QR 관리
          {activeTab === 'qr' && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2D2A4A] rounded-t-xl" />
          )}
        </button>
      </div>

      <div className="mt-8">
        {/* TAB 1: BOOTH INFO */}
        {activeTab === 'info' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <Card className="p-6 border-0 shadow-sm bg-white rounded-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Save className="h-5 w-5 text-[#2D2A4A]" />
                <h2 className="text-xl font-bold text-gray-900">부스 기본 정보</h2>
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
                  <Label htmlFor="locationCode">부스 위치</Label>
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
                  {isSaving ? "저장 중..." : "정보 수정"}
                </Button>
              </form>
            </Card>

            <Card className="p-6 border-0 shadow-sm bg-white rounded-2xl">
              <div className="flex items-center gap-2 mb-6">
                <ImageIcon className="h-5 w-5 text-[#2D2A4A]" />
                <h2 className="text-xl font-bold text-gray-900">이미지 관리</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {/* Rep Image Box */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-base font-bold">대표 이미지 업로드</Label>
                    <p className="text-xs text-gray-400">부스 배경 등에 사용됩니다.</p>
                  </div>

                  <div
                    className="bg-[#F8F9FA] border-2 border-dashed border-gray-200 rounded-xl h-48 flex items-center justify-center cursor-pointer overflow-hidden hover:bg-gray-50 transition-colors relative"
                    onClick={() => repImageInputRef.current?.click()}
                  >
                    {repImagePreview ? (
                      <img src={repImagePreview} alt="대표 이미지 미리보기" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                        <UploadCloud className="h-8 w-8" />
                        <span className="text-sm font-bold">이미지 선택하기</span>
                      </div>
                    )}
                  </div>
                  <Input
                    ref={repImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, true)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    disabled={isUploadingRepImage || !repImageFile}
                    onClick={() => handleImageUploadSubmit(true)}
                    className={cn("w-full h-12 rounded-xl font-bold transition-all border-2", repImageFile ? "bg-[#D9F950] border-[#c0df4a] text-[#2D2A4A] hover:bg-[#c9e843]" : "text-gray-400 border-gray-200 bg-gray-50")}
                  >
                    {isUploadingRepImage ? "업로드 중..." : "대표 이미지 업로드 완료"}
                  </Button>
                </div>

                {/* Logo Image Box */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-base font-bold">로고 이미지 업로드</Label>
                    <p className="text-xs text-gray-400">QR 출력물 등에 사용됩니다.</p>
                  </div>

                  <div
                    className="bg-[#F8F9FA] border-2 border-dashed border-gray-200 rounded-xl h-48 flex items-center justify-center cursor-pointer overflow-hidden hover:bg-gray-50 transition-colors relative"
                    onClick={() => logoImageInputRef.current?.click()}
                  >
                    {logoImagePreview ? (
                      <img src={logoImagePreview} alt="로고 이미지 미리보기" className="w-full h-full object-contain p-4 bg-white" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                        <UploadCloud className="h-8 w-8" />
                        <span className="text-sm font-bold">이미지 선택하기</span>
                      </div>
                    )}
                  </div>
                  <Input
                    ref={logoImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, false)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    disabled={isUploadingImage || !logoImageFile}
                    onClick={() => handleImageUploadSubmit(false)}
                    className={cn("w-full h-12 rounded-xl font-bold transition-all border-2", logoImageFile ? "bg-[#D9F950] border-[#c0df4a] text-[#2D2A4A] hover:bg-[#c9e843]" : "text-gray-400 border-gray-200 bg-gray-50")}
                  >
                    {isUploadingImage ? "업로드 중..." : "로고 이미지 업로드 완료"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: POLICY INFO */}
        {activeTab === 'policy' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6 border-0 shadow-sm bg-white rounded-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="h-5 w-5 text-[#2D2A4A]" />
                <h2 className="text-xl font-bold text-gray-900">부스 운영 정책</h2>
              </div>

              <form onSubmit={handlePolicyUpdate} className="space-y-6 w-full max-w-xl mx-auto py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="staySeconds">예상 체류 시간(초)</Label>
                    <Input
                      id="staySeconds"
                      type="number"
                      value={policyInfo.staySeconds}
                      onChange={(e) => setPolicyInfo({ ...policyInfo, staySeconds: parseInt(e.target.value) || 0 })}
                      className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxWaitingCount">최대 대기 팀 수</Label>
                    <Input
                      id="maxWaitingCount"
                      type="number"
                      value={policyInfo.maxWaitingCount}
                      onChange={(e) => setPolicyInfo({ ...policyInfo, maxWaitingCount: parseInt(e.target.value) || 0 })}
                      className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="callCount">호출 허용 횟수</Label>
                    <Input
                      id="callCount"
                      type="number"
                      value={policyInfo.callCount}
                      onChange={(e) => setPolicyInfo({ ...policyInfo, callCount: parseInt(e.target.value) || 0 })}
                      className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deferLimit">노쇼 취소 제한 횟수</Label>
                    <Input
                      id="deferLimit"
                      type="number"
                      value={policyInfo.deferLimit}
                      onChange={(e) => setPolicyInfo({ ...policyInfo, deferLimit: parseInt(e.target.value) || 0 })}
                      className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="callValidSeconds">호출 유효 시간(초)</Label>
                    <Input
                        id="callValidSeconds"
                        type="number"
                        value={policyInfo.callValidSeconds}
                        onChange={(e) => setPolicyInfo({
                          ...policyInfo,
                          callValidSeconds: parseInt(e.target.value) || 0
                        })}
                        className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                        required
                    />
                </div>

                <Button
                  type="submit"
                  disabled={isSavingPolicy}
                  className="w-full h-12 bg-[#2D2A4A] text-white font-bold rounded-xl mt-4 hover:bg-[#3A375C] transition-all"
                >
                  {isSavingPolicy ? "저장 중..." : "정책 저장"}
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* TAB 3: QR MANAGEMENT */}
        {activeTab === 'qr' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6 border-0 shadow-sm bg-white rounded-2xl h-full flex flex-col items-center">
              <div className="flex w-full items-center gap-2 mb-6">
                <QrCode className="h-5 w-5 text-[#2D2A4A]" />
                <h2 className="text-xl font-bold text-gray-900">부스 QR 관리</h2>
              </div>

              {qrData ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-8 w-full max-w-sm">
                  <div className="p-6 bg-white border-2 border-dashed border-gray-200 rounded-3xl shadow-inner">
                    <QRCodeSVG
                      id="qr-code-svg"
                      value={qrData.qrCode}
                      size={240}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div className="text-center space-y-1 mb-4">
                    <p className="font-bold text-gray-900 text-lg">상태: <span className="text-emerald-500">{qrData.status}</span></p>
                    <p className="text-xs text-gray-400">발급일: {new Date(qrData.issuedAt).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">만료일: {new Date(qrData.expiresAt).toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full pt-4">
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      className="h-12 border-2 border-gray-200 rounded-xl font-bold flex gap-2 hover:bg-gray-50 transition-all"
                    >
                      <Printer className="h-5 w-5 text-gray-600" />
                      QR 출력
                    </Button>
                    <Button
                      onClick={handleReissueQR}
                      variant="outline"
                      className="h-12 border-2 border-[#2D2A4A]/20 text-gray-600 rounded-xl font-bold flex gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                    >
                      <RefreshCw className="h-4 w-4" />
                      QR 재발급
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-20 text-center w-full max-w-sm">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border-4 border-gray-100">
                    <QrCode className="w-12 h-12 text-gray-300" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-gray-900 text-lg">생성된 QR 코드가 없습니다.</p>
                    <p className="text-sm text-gray-400">현장 대기 등록을 활성화하려면 아래 버튼을 눌러 QR 코드를 생성하세요.</p>
                  </div>
                  <Button
                    onClick={handleGenerateQR}
                    className="h-12 px-10 bg-[#D9F950] text-[#2D2A4A] font-extrabold rounded-xl hover:bg-[#c9e843] transition-all mt-4 text-lg w-full"
                  >
                    QR 코드 생성하기
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
