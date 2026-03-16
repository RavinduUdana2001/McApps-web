type Props = {
  title: string;
  actionLabel?: string;
};

export default function SectionHeader({ title, actionLabel = "View All" }: Props) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-2xl font-bold text-[#1c2740] md:text-[2rem]">{title}</h2>
      <button className="rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2d63c8] transition hover:bg-[#e4efff]">
        {actionLabel}
      </button>
    </div>
  );
}