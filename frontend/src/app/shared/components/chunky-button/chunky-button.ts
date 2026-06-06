import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ChunkyButtonColor = 'grape' | 'marigold' | 'teal' | 'coral';
export type ChunkyButtonVariant = 'solid' | 'outline';

const SOLID_CLASSES: Record<ChunkyButtonColor, string> = {
  grape: 'bg-grape shadow-chunk-grape active:shadow-chunk-grape-pressed text-white',
  marigold: 'bg-marigold shadow-chunk-marigold active:shadow-chunk-marigold-pressed text-plum',
  teal: 'bg-teal shadow-chunk-teal active:shadow-chunk-teal-pressed text-white',
  coral: 'bg-coral shadow-chunk-coral active:shadow-chunk-coral-pressed text-white',
};

const OUTLINE_CLASSES: Record<ChunkyButtonColor, string> = {
  grape: 'border-grape text-grape',
  marigold: 'border-marigold text-marigold',
  teal: 'border-teal text-teal',
  coral: 'border-coral text-coral',
};

const SOLID_ENABLED =
  'duration-fast w-full cursor-pointer rounded-full border-0 px-6 py-[15px] font-display text-[17px] font-semibold transition-[transform,box-shadow] ease-smooth tap-transparent active:translate-y-[5px]';

const SOLID_DISABLED =
  'duration-fast w-full cursor-not-allowed rounded-full border-0 px-6 py-[15px] font-display text-[17px] font-semibold opacity-50';

const OUTLINE_ENABLED =
  'w-full cursor-pointer rounded-full border-2 bg-transparent px-5 py-[11px] font-display text-[14px] font-semibold tap-transparent';

const OUTLINE_DISABLED =
  'w-full cursor-not-allowed rounded-full border-2 bg-transparent px-5 py-[11px] font-display text-[14px] font-semibold opacity-50';

@Component({
  selector: 'app-chunky-button',
  imports: [],
  templateUrl: './chunky-button.html',
  styleUrl: './chunky-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChunkyButton {
  readonly variant = input<ChunkyButtonVariant>('solid');
  readonly color = input<ChunkyButtonColor>('grape');
  readonly disabled = input<boolean>(false);

  readonly classes = computed(() => {
    const c = this.color();
    const dis = this.disabled();
    const isSolid = this.variant() === 'solid';
    const solidBase = dis ? SOLID_DISABLED : SOLID_ENABLED;
    const outlineBase = dis ? OUTLINE_DISABLED : OUTLINE_ENABLED;
    const base = isSolid ? solidBase : outlineBase;
    const colorClass = isSolid ? SOLID_CLASSES[c] : OUTLINE_CLASSES[c];
    return `${base} ${colorClass}`;
  });

  protected handleClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
    }
  }
}
