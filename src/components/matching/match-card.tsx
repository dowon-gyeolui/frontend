"use client";

export type MatchCardData = {
  id: string;
  name: string;
  age: number;
  mbti: string;
  comment: string;
  photo: string;
};

/**
 * Glassy candidate card used on Main_Home and the Matching list.
 * Self-contained: caller wraps in any grid.
 */
export function MatchCard({ data }: { data: MatchCardData }) {
  return (
    <article className="relative h-[245px] overflow-hidden rounded-[18px] border border-white/15 bg-white/10 shadow-[0px_10px_20px_0px_rgba(0,0,0,0.3),0px_0px_30px_0px_rgba(168,85,247,0.15)] backdrop-blur-sm">
      {/* Photo with bottom fade so name sits readably */}
      <div className="absolute inset-x-[10px] top-[8px] aspect-[130/149] overflow-hidden rounded-[14px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.photo} alt={data.name} className="size-full object-cover" />
        <div className="absolute inset-0 rounded-[14px] bg-gradient-to-b from-transparent via-transparent to-[#1a1225]/80" />
        <p className="absolute bottom-[6px] right-[10px] text-[14px] font-medium tracking-tight text-white">
          {data.name}
        </p>
      </div>
      <div className="absolute left-[12px] top-[162px] text-[14px] leading-[22px] text-white/80">
        <p>나이 : {data.age}세</p>
        <p>MBTI : {data.mbti}</p>
      </div>
      <p className="absolute bottom-[10px] left-1/2 w-[80%] -translate-x-1/2 whitespace-pre-line text-center text-[10px] text-white">
        {data.comment}
      </p>
    </article>
  );
}

// Mock data shared until the backend exposes /compatibility/candidates.
export const MOCK_MATCH_CARDS: MatchCardData[] = [
  {
    id: "1",
    name: "김민주",
    age: 29,
    mbti: "INFP",
    comment: "둘이 연애하면 장기적으로\n금전운이 정말 좋아요!",
    photo:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
  },
  {
    id: "2",
    name: "설윤아",
    age: 25,
    mbti: "ESFP",
    comment: "서로의 부족한 점을\n완벽하게 보완해줘요",
    photo:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
  },
  {
    id: "3",
    name: "이나경",
    age: 27,
    mbti: "ENTP",
    comment: "서로 이성에 대한 가치관이\n확실해서 싸울 일이 없어요",
    photo:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
  },
  {
    id: "4",
    name: "신시아",
    age: 29,
    mbti: "ISFJ",
    comment: "경직된 당신을 부드럽게\n녹여줄 수 있는 사람이에요.",
    photo:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop",
  },
  {
    id: "5",
    name: "박서연",
    age: 26,
    mbti: "ENFJ",
    comment: "활기찬 에너지로\n당신을 빛나게 해줄 거예요",
    photo:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
  },
  {
    id: "6",
    name: "이수진",
    age: 28,
    mbti: "INTJ",
    comment: "깊이 있는 대화로\n마음을 나눌 수 있어요",
    photo:
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=400&fit=crop",
  },
];