
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
                '대학생을 위한 국제회의 툴 아이데이션을 액션까지 정리하기로 함',
                '국제회의에서 핵심 문제를 “언어 장벽 + 진행 불안”으로 정의하고, 한 화면에서 실시간 요약과 진행 가이드를 제공하는 방향에 공감대 형성',
                '기능을 회의 전/중/후로 나누어 정리: (전) 시간대 변환·사전 질문 수집→아젠다화, (중) 타임박스·역할 가이드+요약, (후) 결정/할일 공유',
                'MVP 우선순위로 “회의 중 요약+할일 자동 정리”와 “사전 질문→아젠다 자동화”를 상위로 선정',
            ],
            actionItems: [
                'MVP 요구사항을 1페이지로 정리 (Ahn)',
                '학생 페르소나와 핵심 페인포인트 3가지 정리 (Ryu)',
                '사전 준비 플로우(초대 링크, 시간대 변환, 사전 질문 수집→아젠다화) 작성 (Jo)',
                '기술 구성 메모(프론트/백엔드/AI 연동, 실시간 협업 구성) 작성 (Shuhei)',
            ],
            decisions: [
                'MVP 범위는 “회의 중 요약(요점/결정/할일) + 진행 가이드”를 중심으로 하고, “사전 질문→아젠다화”를 두 번째 축으로 가져감',
                '초기 구현은 웹앱 기반으로 단순화하고, 실시간 노트(예: Firebase/Supabase류) + 요약/추출 중심의 AI 연동 구조를 우선 검토',
                '다음 정렬 미팅을 10분으로 짧게 다시 진행해 산출물(요구사항/페르소나/플로우/기술메모)을 합치기로 함',
            ],
        },

        ja: {
            keyPoints: [
                '大学生向け国際会議ツールのアイデアを整理し、方向性と次アクションまで決める方針で開始',
                '国際会議の核心課題を「言語の壁 + 進行不安」と定義し、1画面でリアルタイム要約と進行ガイドを提供する方向に合意',
                '機能を会議の前/中/後で整理：(前)時差変換・事前質問→議題化、(中)タイムボックス/役割ガイド+要約、(後)決定/ToDo共有',
                'MVP優先度として「会議中の要約+ToDo自動整理」と「事前質問→議題自動化」を上位に設定',
            ],
            actionItems: [
                'MVP要件を1ページに整理 (Ahn)',
                '学生ペルソナと主要ペインポイント3つを整理 (Ryu)',
                '事前準備フロー（招待リンク、時差変換、事前質問→議題化）を作成 (Jo)',
                '技術構成メモ（フロント/バック/AI連携、リアルタイム協業）を作成 (Shuhei)',
            ],
            decisions: [
                'MVPは「会議中の要約（要点/決定/ToDo）+進行ガイド」を中心にし、「事前質問→議題化」を第2軸として採用',
                '初期実装はWebアプリに単純化し、リアルタイムノート（例：Firebase/Supabase系）+要約/抽出中心のAI連携を優先検討',
                '次回は10分の短い同期で、要件/ペルソナ/フロー/技術メモを統合する',
            ],
        },

        en: {
            keyPoints: [
                'Started a 3-minute ideation to align on direction and next actions for an international meeting tool for university students',
                'Defined the core problem as “language barriers + facilitation anxiety” and aligned on a single-screen experience with real-time summarization and facilitation guidance',
                'Organized features across before/during/after meeting: (before) time-zone conversion and pre-questions → agenda, (during) timeboxing/roles guidance + summaries, (after) sharing decisions and action items',
                'Set MVP priorities as “in-meeting summary + action-item extraction” first, and “pre-questions → agenda automation” second',
            ],
            actionItems: [
                'Create a one-page MVP requirements doc (Ahn)',
                'Define a student persona and top 3 pain points (Ryu)',
                'Draft the pre-meeting flow (invite link, time-zone conversion, pre-questions → agenda) (Jo)',
                'Draft a technical architecture memo (front/back/AI integration, real-time collaboration) (Shuhei)',
            ],
            decisions: [
                'MVP will focus on “in-meeting summaries (key points/decisions/action items) + facilitation guidance”, with “pre-questions → agenda” as the second pillar',
                'Initial build should be simplified as a web app with a real-time note component (e.g., Firebase/Supabase-like) and AI focused on summarization/extraction',
                'Hold a short 10-minute follow-up sync to merge deliverables (requirements/persona/flow/tech memo) into one plan',
            ],
        },
    };

    return summaries[language];
}