import { Language } from '../i18n/translations';

interface SummaryData {
    keyPoints: string[];
    actionItems: string[];
    decisions: string[];
}

export function getMockSummaryData(language: Language): SummaryData {
    const summaries: Record<Language, SummaryData> = {
        ko: {
            keyPoints: [
                '런칭 1주일 전, 고화질 영상 업로드 시 서버 지연(5초 이상) 및 셧다운 위험 발생',
                '4K 화질 유지는 마케팅의 핵심 전략이므로 화질 타협 불가',
                'Uri-Tomo AI가 비동기 처리 및 점진적 화질 적용 방식을 제안하여 채택됨',
                '최악의 경우 대기열 초과 시 일시적 업로드 차단 및 예약 시스템으로 전환하기로 결정',
            ],
            actionItems: [
                '비동기 처리 시스템 개발 및 개발 서버 반영 - 내일 아침까지 완료 (Ryu)',
                '고화질 변환 중 아이콘 및 프로그레스바 UI 디자인 제작 (Jin)',
                '업로드 제한 중 화면 및 알림 예약 UI 디자인 작성 (Jin)',
                '서킷 브레이커 기능을 백엔드에 구현하여 시스템 과부하 방지 (Ryu)',
            ],
            decisions: [
                '1안: 비동기 처리(Asynchronous Processing)를 통한 저화질 프리뷰 우선 생성 및 4K 원본 후처리',
                '2안: 대기열 한계치(5,000건) 초과 시 Upload Throttling 및 예약 알림 시스템 적용',
                '런칭 종료 후 개발팀에게 야키니쿠 회식 제공 (Shuhei 약속)',
            ],
        },
        ja: {
            keyPoints: [
                'ローンチ1週間前、高画質動画アップロード時にサーバー遅延(5秒以上)およびシャットダウンリスクが発生',
                '4K画質の維持はマーケティングの核心戦略であり、画質妥協は不可',
                'Uri-Tomo AIが非同期処理と段階的画質適用方式を提案し、採用',
                '最悪の場合、キュー超過時に一時的なアップロード制限と予約システムに切り替えることを決定',
            ],
            actionItems: [
                '非同期処理システムの開発と開発サーバーへの反映 - 明朝までに完了 (Ryu)',
                '高画質変換中のアイコンとプログレスバーUIデザイン制作 (Jin)',
                'アップロード制限中の画面と通知予約UIデザイン作成 (Jin)',
                'サーキットブレーカー機能をバックエンドに実装してシステム過負荷防止 (Ryu)',
            ],
            decisions: [
                '案1: 非同期処理(Asynchronous Processing)による低画質プレビュー優先生成と4K原本後処理',
                '案2: キュー上限(5,000件)超過時にUpload Throttlingと予約通知システムを適用',
                'ローンチ終了後、開発チームに焼肉会食を提供 (Shuheiの約束)',
            ],
        },
        en: {
            keyPoints: [
                'One week before launch, server delays (5+ seconds) and shutdown risks occurred during high-quality video uploads',
                'Maintaining 4K quality is a core marketing strategy, so quality compromise is not acceptable',
                'Uri-Tomo AI proposed and adopted asynchronous processing and progressive quality application approach',
                'Decided to switch to temporary upload blocking and reservation system when queue exceeds capacity in worst case',
            ],
            actionItems: [
                'Develop asynchronous processing system and deploy to dev server - Complete by tomorrow morning (Ryu)',
                'Create icon and progress bar UI design during high-quality conversion (Jin)',
                'Write screen and notification reservation UI design during upload restriction (Jin)',
                'Implement circuit breaker functionality in backend to prevent system overload (Ryu)',
            ],
            decisions: [
                'Option 1: Generate low-quality preview first and post-process 4K original through Asynchronous Processing',
                'Option 2: Apply Upload Throttling and reservation notification system when queue limit (5,000) is exceeded',
                'Provide yakiniku dinner for development team after launch completion (Shuhei\'s promise)',
            ],
        },
    };

    return summaries[language];
}
