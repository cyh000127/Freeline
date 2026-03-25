"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { PauseCircle, XCircle, Plus, X, Trash2 } from "lucide-react";
import { getGoodsList, createGoods, updateGoodsStatus, deleteGoods, Goods } from "@/lib/api/goods";
import { useAuth } from "@/context/AuthContext";

export default function GoodsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const boothId = user?.boothId || 0;
  const [goods, setGoods] = useState<Goods[]>([]);
  const [filter, setFilter] = useState<"ALL" | "ON_SALE" | "SOLD_OUT">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoodsName, setNewGoodsName] = useState("");
  const [newGoodsImage, setNewGoodsImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (boothId) {
      fetchGoods();
    }
  }, [boothId]);

  const fetchGoods = async () => {
    try {
      setIsLoading(true);
      const res = await getGoodsList(boothId);
      if (res.success && res.data) {
        setGoods(res.data);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setGoods([]);
      } else {
        console.error("Failed to fetch goods:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (item: Goods) => {
    try {
      // isSoldOut is effectively toggled.
      const newStatus = !item.isSoldOut;
      await updateGoodsStatus(item.goodsId, newStatus);
      // Update local state
      setGoods((prev) =>
        prev.map((g) =>
          g.goodsId === item.goodsId ? { ...g, isSoldOut: newStatus } : g
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  const handleDeleteGoods = async (goodsId: number) => {
    if (!window.confirm("정말로 이 굿즈를 삭제하시겠습니까? (삭제 후 복구할 수 없습니다)")) {
      return;
    }
    
    try {
      await deleteGoods(goodsId);
      alert("굿즈가 성공적으로 삭제되었습니다.");
      setGoods((prev) => prev.filter((g) => g.goodsId !== goodsId));
    } catch (error) {
      console.error("Failed to delete goods:", error);
      alert("굿즈 삭제에 실패했습니다.");
    }
  };

  const handleCreateGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoodsName || !newGoodsImage) {
      alert("이름과 이미지를 모두 등록해주세요.");
      return;
    }
    
    try {
      await createGoods(boothId, { name: newGoodsName, imageFile: newGoodsImage });
      alert("굿즈가 성공적으로 추가되었습니다.");
      setIsModalOpen(false);
      setNewGoodsName("");
      setNewGoodsImage(null);
      setPreviewUrl("");
      fetchGoods(); // Refresh list
    } catch (error) {
      console.error("Failed to create goods:", error);
      alert("굿즈 생성에 실패했습니다.");
    }
  };

  const filteredGoods = goods.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "ON_SALE") return !item.isSoldOut;
    if (filter === "SOLD_OUT") return item.isSoldOut;
    return true;
  });

  return (
    <div className="p-8">
      {/* Header Area (Shared with Dashboard roughly) */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
            실시간 대기 현황
          </h1>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-sm font-medium text-gray-700">현재 부스 정상 운영 중</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Card className="flex h-14 items-center px-5 shadow-sm border-0 bg-white">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-gray-500">예상 대기 시간</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tighter text-gray-900">0</span>
                <span className="text-sm font-medium text-gray-900">분</span>
              </div>
            </div>
          </Card>

          <button className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-6 font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FBBF24] hover:shadow-md">
            <PauseCircle className="h-5 w-5" />
            운영중지
          </button>
          
          <button className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-6 font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F87171] hover:shadow-md">
            <XCircle className="h-5 w-5" />
            운영종료
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 mt-2">
        {/* Filters and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex h-14 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm border border-gray-100">
            <button
              onClick={() => setFilter("ALL")}
              className={`inline-flex h-full items-center justify-center rounded-xl px-8 text-sm font-bold transition-all duration-200 ${
                filter === "ALL"
                  ? "bg-[#2D2A4A] text-white shadow hover:-translate-y-0.5 hover:bg-[#3A375C] hover:shadow-md"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter("ON_SALE")}
              className={`inline-flex h-full items-center justify-center rounded-xl px-8 text-sm font-bold transition-all duration-200 ${
                filter === "ON_SALE"
                  ? "bg-[#2D2A4A] text-white shadow hover:-translate-y-0.5 hover:bg-[#3A375C] hover:shadow-md"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              }`}
            >
              판매 중
            </button>
            <button
              onClick={() => setFilter("SOLD_OUT")}
              className={`inline-flex h-full items-center justify-center rounded-xl px-8 text-sm font-bold transition-all duration-200 ${
                filter === "SOLD_OUT"
                  ? "bg-[#2D2A4A] text-white shadow hover:-translate-y-0.5 hover:bg-[#3A375C] hover:shadow-md"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              }`}
            >
              품절
            </button>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-14 items-center gap-2 rounded-xl bg-lime-400 px-6 text-sm font-bold text-[#2D2A4A] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-lime-500 hover:shadow-md"
          >
            <Plus className="h-5 w-5" />
            굿즈 추가
          </button>
        </div>

        {/* Goods Grid */}
        {authLoading || (isLoading && boothId) ? (
          <div className="flex flex-1 items-center justify-center text-lg font-medium text-gray-400 mt-10">
            로딩 중...
          </div>
        ) : !boothId && !authLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 mt-10">
            <div className="text-lg font-medium text-red-400">부스 정보를 찾을 수 없습니다.</div>
            <button 
              onClick={() => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("boothId");
                window.location.href = "/login";
              }}
              className="px-6 py-2 rounded-xl bg-[#2D2A4A] text-white font-bold"
            >
              다시 로그인하기
            </button>
          </div>
        ) : filteredGoods.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-lg font-medium text-gray-400 mt-10">
            조건에 맞는 굿즈가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGoods.map((item) => (
              <Card
                key={item.goodsId}
                className={`group relative flex flex-col shadow-sm border-0 p-5 ${
                  item.isSoldOut ? "bg-rose-50" : "bg-emerald-50"
                }`}
              >
                {/* Delete Button (Appears on hover or always visible, we make it always visible but subtle) */}
                <button
                  onClick={() => handleDeleteGoods(item.goodsId)}
                  className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:text-rose-500 hover:bg-white/60 transition-colors z-10"
                  title="굿즈 삭제"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                {/* Title */}
                <div className="text-center font-bold text-gray-900 mb-4 text-lg">
                  {item.name}
                </div>
                
                {/* Image Container */}
                <div className="bg-white rounded-xl flex items-center justify-center p-2 mb-4 border-2 border-white aspect-square w-full shadow-sm mx-auto overflow-hidden">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                         e.currentTarget.src = "https://via.placeholder.com/160?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="text-gray-300 text-sm">No Image</div>
                  )}
                </div>

                {/* Status Toggle Button */}
                <button
                  onClick={() => handleToggleStatus(item)}
                  className={`py-3 w-full rounded-xl font-bold text-base transition-colors ${
                    item.isSoldOut
                      ? "text-rose-500 hover:bg-rose-100"
                      : "text-emerald-500 hover:bg-emerald-100"
                  }`}
                >
                  {item.isSoldOut ? "품절" : "판매 중"}
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Goods Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">새로운 굿즈 추가</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGoods} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  굿즈 이름
                </label>
                <input
                  type="text"
                  value={newGoodsName}
                  onChange={(e) => setNewGoodsName(e.target.value)}
                  placeholder="예: 한정판 키링"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 outline-none transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이미지 첨부
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    id="goods-image-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewGoodsImage(e.target.files[0]);
                        setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    required
                  />
                  <label
                    htmlFor="goods-image-upload"
                    className="cursor-pointer px-4 py-3 rounded-xl border border-gray-200 hover:border-lime-400 bg-white text-sm font-medium text-gray-700 hover:bg-lime-50 transition-all flex items-center gap-2"
                  >
                    이미지 선택
                  </label>
                  <span className="text-sm text-gray-500 flex-1 truncate">
                    {newGoodsImage ? newGoodsImage.name : "선택된 파일이 없습니다"}
                  </span>
                </div>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-2">미리보기</span>
                  <div className="w-32 h-32 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewGoodsImage(null);
                    setPreviewUrl("");
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-[#2D2A4A] bg-lime-400 hover:bg-lime-500 transition-colors"
                >
                  추가하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
