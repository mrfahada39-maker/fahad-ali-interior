import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-r from-[#EFE8DC]/85 via-[#F7F2EA]/95 to-[#EFE8DC]/85 border border-[#E5DCD0]/60 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]',
        className
      )}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-[#E7DDD0] p-4 space-y-4 shadow-2xs overflow-hidden">
      {/* Image Skeleton */}
      <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
      
      {/* Category Pill */}
      <Skeleton className="h-4 w-24 rounded-full" />
      
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-4.5 w-full rounded-md" />
        <Skeleton className="h-4.5 w-2/3 rounded-md" />
      </div>
      
      {/* Price & Action */}
      <div className="pt-3 border-t border-[#EAE0D5] flex items-center justify-between">
        <Skeleton className="h-5 w-28 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}
