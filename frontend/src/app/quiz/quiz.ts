import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { ApiConfiguration } from '../backend-client';
import { QuizStore } from './quiz.store';
import { QuizAnswerReveal } from './quiz-answer-reveal/quiz-answer-reveal';
import { QuizPhoto } from './quiz-photo/quiz-photo';
import { QuizHostReveal } from './quiz-host-reveal/quiz-host-reveal';

const ISO_CODES = [
  'AD',
  'AE',
  'AF',
  'AG',
  'AI',
  'AL',
  'AM',
  'AO',
  'AQ',
  'AR',
  'AS',
  'AT',
  'AU',
  'AW',
  'AX',
  'AZ',
  'BA',
  'BB',
  'BD',
  'BE',
  'BF',
  'BG',
  'BH',
  'BI',
  'BJ',
  'BL',
  'BM',
  'BN',
  'BO',
  'BQ',
  'BR',
  'BS',
  'BT',
  'BV',
  'BW',
  'BY',
  'BZ',
  'CA',
  'CC',
  'CD',
  'CF',
  'CG',
  'CH',
  'CI',
  'CK',
  'CL',
  'CM',
  'CN',
  'CO',
  'CR',
  'CU',
  'CV',
  'CW',
  'CX',
  'CY',
  'CZ',
  'DE',
  'DJ',
  'DK',
  'DM',
  'DO',
  'DZ',
  'EC',
  'EE',
  'EG',
  'EH',
  'ER',
  'ES',
  'ET',
  'FI',
  'FJ',
  'FK',
  'FM',
  'FO',
  'FR',
  'GA',
  'GB',
  'GD',
  'GE',
  'GF',
  'GG',
  'GH',
  'GI',
  'GL',
  'GM',
  'GN',
  'GP',
  'GQ',
  'GR',
  'GS',
  'GT',
  'GU',
  'GW',
  'GY',
  'HK',
  'HM',
  'HN',
  'HR',
  'HT',
  'HU',
  'ID',
  'IE',
  'IL',
  'IM',
  'IN',
  'IO',
  'IQ',
  'IR',
  'IS',
  'IT',
  'JE',
  'JM',
  'JO',
  'JP',
  'KE',
  'KG',
  'KH',
  'KI',
  'KM',
  'KN',
  'KP',
  'KR',
  'KW',
  'KY',
  'KZ',
  'LA',
  'LB',
  'LC',
  'LI',
  'LK',
  'LR',
  'LS',
  'LT',
  'LU',
  'LV',
  'LY',
  'MA',
  'MC',
  'MD',
  'ME',
  'MF',
  'MG',
  'MH',
  'MK',
  'ML',
  'MM',
  'MN',
  'MO',
  'MP',
  'MQ',
  'MR',
  'MS',
  'MT',
  'MU',
  'MV',
  'MW',
  'MX',
  'MY',
  'MZ',
  'NA',
  'NC',
  'NE',
  'NF',
  'NG',
  'NI',
  'NL',
  'NO',
  'NP',
  'NR',
  'NU',
  'NZ',
  'OM',
  'PA',
  'PE',
  'PF',
  'PG',
  'PH',
  'PK',
  'PL',
  'PM',
  'PN',
  'PR',
  'PS',
  'PT',
  'PW',
  'PY',
  'QA',
  'RE',
  'RO',
  'RS',
  'RU',
  'RW',
  'SA',
  'SB',
  'SC',
  'SD',
  'SE',
  'SG',
  'SH',
  'SI',
  'SJ',
  'SK',
  'SL',
  'SM',
  'SN',
  'SO',
  'SR',
  'SS',
  'ST',
  'SV',
  'SX',
  'SY',
  'SZ',
  'TC',
  'TD',
  'TF',
  'TG',
  'TH',
  'TJ',
  'TK',
  'TL',
  'TM',
  'TN',
  'TO',
  'TR',
  'TT',
  'TV',
  'TW',
  'TZ',
  'UA',
  'UG',
  'UM',
  'US',
  'UY',
  'UZ',
  'VA',
  'VC',
  'VE',
  'VG',
  'VI',
  'VN',
  'VU',
  'WF',
  'WS',
  'YE',
  'YT',
  'ZA',
  'ZM',
  'ZW',
];

function buildCountries(): readonly { code: string; name: string }[] {
  const dn = new Intl.DisplayNames(['de'], { type: 'region' });
  return ISO_CODES.map((code) => ({ code, name: dn.of(code) ?? code })).sort((a, b) =>
    a.name.localeCompare(b.name, 'de'),
  );
}

@Component({
  selector: 'app-quiz',
  imports: [
    MatRadioGroup,
    MatRadioButton,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    QuizAnswerReveal,
    QuizPhoto,
    QuizHostReveal,
  ],
  templateUrl: './quiz.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Quiz {
  protected readonly quizStore = inject(QuizStore);
  private readonly apiConfig = inject(ApiConfiguration);

  protected readonly allCountries = buildCountries();
  protected readonly q2CountryInput = signal('');
  protected readonly filteredCountries = computed(() => {
    const q = this.q2CountryInput().toLowerCase();
    if (!q) return this.allCountries;
    return this.allCountries.filter((c) => c.name.toLowerCase().includes(q));
  });
  protected readonly currentQuestion = computed<'q1' | 'q2'>(() =>
    this.quizStore.q2Status() === 'Open' ? 'q2' : 'q1',
  );

  protected readonly bothRevealed = computed(() => {
    const session = this.quizStore.session();
    return (
      this.quizStore.q1Status() === 'Closed' &&
      !!session?.voting.q1.correctAnswer &&
      this.quizStore.q2Status() === 'Closed' &&
      !!session.voting.q2.correctAnswer
    );
  });

  protected readonly q1AnswerEntries = computed(() =>
    Object.values(this.quizStore.session()?.voting.q1.answers ?? {}),
  );
  protected readonly q2AnswerEntries = computed(() =>
    Object.values(this.quizStore.session()?.voting.q2.answers ?? {}).map((e) => ({
      displayName: e.displayName,
      answer: this.countryName(e.answer),
    })),
  );

  protected photoUrl(question: 'q1' | 'q2'): string {
    const id = this.quizStore.session()?.sessionId;
    return id ? `${this.apiConfig.rootUrl}/sessions/${id}/photos/${question}` : '';
  }

  protected submit(answer: 'A' | 'B' | 'C'): void {
    void this.quizStore.submitQ1Answer(answer);
  }

  protected submitQ2(code: string): void {
    void this.quizStore.submitQ2Answer(code);
  }

  protected refresh(): void {
    void this.quizStore.refresh();
  }

  protected onCloseQ1Voting(answer: 'A' | 'B' | 'C'): void {
    void this.quizStore.setQ1CorrectAnswer(answer);
  }

  protected onCloseQ2Voting(countryCode: string): void {
    void this.quizStore.setQ2CorrectAnswer(countryCode);
  }

  protected countryName(code: string): string {
    return this.allCountries.find((c) => c.code === code)?.name ?? code;
  }
}
