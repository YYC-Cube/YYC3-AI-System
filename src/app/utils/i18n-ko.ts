/**
 * @file i18n-ko.ts
 * @description YYC³便携式智能AI系统 - 韩语国际化文件
 * Korean (한국어) locale overrides
 * Partial overrides merged onto `en` base in i18n-data.ts getI18n()
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags i18n,korean,localization
 */

import type { I18nStrings } from './i18n-types'

/** Korean overrides – keys not listed here fall back to English */
export const koOverrides: Partial<I18nStrings> = {
  // Brand
  brandName: 'YanYu Cloud', brandSlogan: '말이 천 줄의 코드를 전하고 | 언어가 만물의 지능을 엮다',
  // Header
  home: '홈', projects: '프로젝트', notifications: '알림', settings: '설정', github: 'GitHub', share: '공유', deploy: '배포', quickActions: '빠른 작업', language: '언어', user: '사용자', themeSwitch: '테마 전환', themeCustomize: '테마 커스터마이즈',
  // View
  back: '뒤로', preview: '미리보기', code: '코드', fullscreenPreview: '전체화면 미리보기', search: '검색', more: '더보기',
  // AI
  aiModel: 'AI 모델', aiChat: 'AI 채팅', aiSettings: 'AI 설정', configModel: '모델 설정', selectModel: '모델 선택',
  // Chat
  chatPlaceholder: '메시지 입력...', chatStreamingPlaceholder: 'AI 응답 중...', send: '전송', slashCommands: '슬래시 명령', addAttachment: '첨부 추가', uploadImage: '이미지 업로드', insertCode: '코드 삽입', enterToSend: 'Enter로 전송', shiftEnterNewline: 'Shift+Enter로 줄바꿈', slashShortcut: '/로 명령',
  // File
  explorer: '탐색기', searchFiles: '파일 검색', newFile: '새 파일', newFolder: '새 폴더', rename: '이름 변경', copy: '복사', copyPath: '경로 복사', delete: '삭제', selectedFile: '선택된 파일', noFileSelected: '파일 미선택', totalFiles: '전체 파일 수',
  // Editor
  copyCode: '코드 복사', systemReport: '시스템 리포트', backToCode: '코드로 돌아가기', aiCodeInjection: 'AI 코드 주입', diffPreview: '차이 미리보기', acceptChanges: '변경 적용', reject: '거부', collaboratorsOnFile: '파일 공동 편집자',
  // Terminal
  terminal: '터미널', newTerminal: '새 터미널', tmRename: '이름 변경', tmBash: 'Bash', tmZsh: 'Zsh', tmNode: 'Node', tmPython: 'Python', tmSplit: '분할', tmSearch: '검색', tmSearchPlaceholder: '검색...', tmProcessRunning: '프로세스 실행 중', tmKillProcess: '프로세스 종료', tmClearAll: '모두 지우기', tmSelectShell: '셸 선택', tmCloseConfirm: '닫으시겠습니까?', tmMaximize: '최대화', tmRestore: '복원',
  // Preview
  livePreview: '실시간 미리보기', componentPreview: '컴포넌트 미리보기', componentGallery: '컴포넌트 갤러리', refresh: '새로고침', openInNewWindow: '새 창에서 열기', ready: '준비됨', loading: '로딩 중',
  // Projects
  recentProjects: '최근 프로젝트', viewAll: '전체 보기', active: '활성', draft: '초안', archived: '보관됨', minutesAgo: '{n}분 전', hoursAgo: '{n}시간 전', daysAgo: '{n}일 전',
  // User
  online: '온라인', preferences: '환경설정', shortcuts: '단축키', profile: '프로필', openWorkspace: '작업공간 열기',
  // More
  toggleTerminal: '터미널 토글', exportProject: '프로젝트 내보내기', documentation: '문서',
  // Toolbar
  pluginExtensions: '플러그인/확장', modelManagement: '모델 관리', helpGuide: '도움말 가이드', fileManager: '파일 관리자', integratedTerminal: '통합 터미널', componentLayers: '컴포넌트 레이어',
  // Code tools
  formatCode: '코드 포맷', aiAutocomplete: 'AI 자동완성', filterFiles: '파일 필터',
  // Footer
  footerText: 'YYC³ AI Code — 만상이 클라우드 피벗에 귀일하고, 딥스택이 지능의 새 시대를 열다',
  // Swap
  releaseToSwap: '놓아서 교체', dragToSwap: '드래그하여 교체',
  // Actions
  projectsPanel: '프로젝트 패널', createProject: '프로젝트 생성', projectSettings: '프로젝트 설정', openProject: '프로젝트 열기', deleteProject: '프로젝트 삭제', renameProject: '프로젝트 이름 변경',
  githubConnect: 'GitHub 연결', githubPush: 'Git 푸시', githubPull: 'Git 풀', githubClone: 'Git 클론', githubRepo: 'GitHub 저장소',
  shareProject: '프로젝트 공유', shareCopyLink: '링크 복사', shareInvite: '초대', shareExport: '내보내기', shareEmbedCode: '임베드 코드',
  deployProject: '배포', deployPreview: '프리뷰 배포', deployProduction: '프로덕션 배포', deployStatus: '배포 상태',
  quickActionsMenu: '빠른 작업 메뉴', newProject: '새 프로젝트', openTerminal: '터미널 열기', runBuild: '빌드 실행', runTests: '테스트 실행', gitCommit: 'Git 커밋', openDocs: '문서 열기',
  shortcutsDialog: '단축키 목록', pluginMarket: '플러그인 마켓', pluginInstalled: '설치됨', pluginAvailable: '사용 가능',
  helpCenter: '도움말 센터', helpDocs: '문서', helpFeedback: '피드백', helpAbout: '정보',
  formatSuccess: '포맷 완료', codeCopied: '코드 복사됨', aiSuggesting: 'AI 제안 중',
  gitStatus: 'Git 상태', gitBranch: '브랜치', gitCommitMsg: '커밋 메시지', gitPushRemote: '원격으로 푸시', gitPush: '푸시', gitPull: '풀', gitSync: '동기화',
  attachFile: '파일 첨부', attachImage: '이미지 첨부', attachCode: '코드 첨부', attachGithub: 'GitHub 링크', attachFigma: 'Figma 파일', attachClipboard: '클립보드',
  featureComingSoon: '곧 출시 예정', version: '버전', expandMenu: '메뉴 확장', importFile: '파일 가져오기', codeSnippet: '코드 스니펫', clipboard: '클립보드', duplicate: '복제', archive: '보관', create: '생성', searchEllipsis: '검색...',
  // Toast
  toastImageUpload: '이미지 업로드됨', toastFileImport: '파일 가져오기 완료', toastGithubLinkOpened: 'GitHub 링크 열림', toastFigmaImport: 'Figma 파일 가져오기 완료', toastCodeTemplateInserted: '코드 템플릿 삽입됨', toastClipboardPasted: '클립보드에서 붙여넣기 완료', toastClipboardError: '클립보드 오류', toastProjectCreated: '프로젝트 생성됨', toastProjectDeleted: '프로젝트 삭제됨', toastProjectArchived: '프로젝트 보관됨', toastProjectDuplicated: '프로젝트 복제됨', toastAllRead: '모두 읽음', toastMarkAllRead: '모두 읽음 표시', toastGithubConnected: 'GitHub 연결됨', toastCloneDialogOpened: '클론 다이얼로그 열림', toastCodePushed: '코드 푸시됨', toastCodePulled: '코드 풀됨', toastRepoOpened: '저장소 열림', toastLinkCopied: '링크 복사됨', toastInviteSent: '초대 발송됨', toastExportedZip: 'ZIP 내보내기 완료', toastEmbedCopied: '임베드 코드 복사됨', toastPreviewDeploy: '프리뷰 배포 중', toastProductionDeploy: '프로덕션 배포 중', toastDeployReady: '배포 준비 완료', toastBuildStarted: '빌드 시작', toastTestsRunning: '테스트 실행 중', toastAllCommitted: '모두 커밋됨', toastNotificationsRead: '알림 읽음 처리됨', toastSwitchedTo: '전환: ', toastRenameTriggered: '이름 변경 트리거', toastDocsOpened: '문서 열림', toastFeedbackSent: '피드백 전송됨', toastPluginInstalled: '플러그인 설치됨', toastFileCreated: '파일 생성됨', toastFolderCreated: '폴더 생성됨', toastSearchResults: '검색 결과', toastSwitchedMode: '모드 전환', toastProjectRefreshed: '프로젝트 새로고침', toastComponentLayersOpened: '컴포넌트 레이어 열림', toastFormatted: '포맷 완료', toastAiAnalyzing: 'AI 분석 중', toastAiSuggestions: 'AI 제안', toastGitStatusInfo: 'Git 상태 정보', toastGitCommitted: '커밋 완료', toastPushedToOrigin: 'origin에 푸시 완료', toastAlreadyUpToDate: '최신 상태', toastSyncing: '동기화 중', toastLanguageSwitched: '언어 전환됨', toastModelCallFailed: '모델 호출 실패', toastFallbackResponse: '폴백 응답', toastUnknownError: '알 수 없는 오류', toastConnected: '연결됨', toastConnectionFailed: '연결 실패', toastNotTested: '미테스트',
  // Notifications
  notifAutoSaved: '자동 저장됨', notifAiConnected: 'AI 연결됨', notifBuildComplete: '빌드 완료', notifUpdateAvailable: '업데이트 가능', notifSystemReady: '시스템 준비 완료', notifDashboardBuild: '대시보드 빌드', notifSyncComplete: '동기화 완료',
  // Commands
  cmdCodeDesc: '코드 스니펫 생성', cmdArchDesc: '아키텍처 제안 보기', cmdHelpDesc: '도움말 콘텐츠 보기',
  // Header collab
  selectTheme: '테마 선택', editing: '편집 중', lineNumber: '줄', idle: '유휴', offlineCount: '오프라인 {count}',
  // System Report
  reportLayoutReady: '레이아웃 준비 완료', reportSyncLatency: '동기화 지연시간', reportDesignParsing: '디자인 파싱',
  // Theme Presets
  themeLight: '라이트', themeDark: '다크', themeMidnight: '미드나이트', themeForest: '포레스트', themeSunset: '선셋',
  // Projects desc
  projDescDashboard: '대시보드', projDescDesignSystem: '디자인 시스템', projDescAiChat: 'AI 채팅 인터페이스', projDescCodeGen: '코드 생성 엔진',
  // Store defaults
  defaultThemeName: '기본 테마', initialAiMessage: '안녕하세요! YYC³ AI 어시스턴트입니다. 무엇을 도와드릴까요?',
  // Simulator
  simDefault: 'AI 어시스턴트가 생각 중...', simCode: '코드 생성 중...', simArchitecture: '아키텍처 분석 중...', simHelp: '도움말 정보 가져오는 중...',
  // Command Palette
  cpPlaceholder: '명령 검색...', cpNoResults: '결과 없음', cpNavigation: '내비게이션', cpActions: '액션', cpThemes: '테마', cpTools: '도구',
  // Shortcut
  scViewSwitch: '뷰 전환', scTerminalPanel: '터미널/패널', scProjectOps: '프로젝트 작업', scEditor: '에디터', scChat: '채팅', scBackToCode: '코드로 돌아가기', scSwitchPreview: '미리보기 전환', scSwitchCode: '코드 전환', scToggleTerminal: '터미널 토글', scGlobalSearch: '전역 검색', scOpenSettings: '설정 열기', scProjectMgmt: '프로젝트 관리', scNotifications: '알림', scGithub: 'GitHub', scShareProject: '프로젝트 공유', scDeploy: '배포', scQuickActions: '빠른 작업', scSwitchLang: '언어 전환', scMoreMenu: '더보기 메뉴', scSendMessage: '메시지 전송', scNewline: '줄바꿈', scSlashCommands: '슬래시 명령', scCommandPalette: '명령 팔레트',
  // Plugins
  pluginCodeAnalyzer: '코드 분석기', pluginDesignSync: '디자인 동기화', pluginTestGenerator: '테스트 생성기', pluginDocWriter: '문서 생성기',
  // New feature panels
  plTitle: '플러그인 시스템', plSubtitle: 'registerPlugin 확장 등록 및 샌드박스 관리', plInstalled: '설치됨', plAvailable: '사용 가능', plSearch: '플러그인 검색', plInstall: '설치', plUninstall: '제거', plEnable: '활성화', plDisable: '비활성화', plName: '이름', plVersion: '버전', plAuthor: '작성자', plDescription: '설명', plStatus: '상태', plActive: '활성', plInactive: '비활성', plLoading: '로딩 중', plError: '오류', plRegister: '등록', plSandbox: '샌드박스', plPermissions: '권한', plApi: 'API', plHooks: '후크', plSettings: '설정', plNoPlugins: '플러그인 없음', plConfirmUninstall: '이 플러그인을 제거하시겠습니까?', plInstallSuccess: '설치 성공', plUninstallSuccess: '제거 성공',
  swTitle: '오프라인 캐시', swSubtitle: 'Service Worker 전략 및 에셋 프리캐시', swOnline: '온라인', swOffline: '오프라인', swStatus: '상태', swCached: '캐시됨', swCacheSize: '캐시 크기', swPrecache: '프리캐시', swPrecaching: '프리캐시 중...', swClearCache: '캐시 삭제', swCacheCleared: '캐시 삭제됨', swAssets: '정적 에셋', swApi: 'API 데이터', swFonts: '폰트', swImages: '이미지', swStrategy: '전략', swCacheFirst: '캐시 우선', swNetworkFirst: '네트워크 우선', swStaleRevalidate: 'Stale While Revalidate', swLastSync: '마지막 동기화', swSyncNow: '지금 동기화', swSyncing: '동기화 중...', swEnabled: '활성', swDisabled: '비활성',
  sdTitle: '시스템 대시보드', sdSubtitle: '패널 사용량, AI 비용, 성능 지표, 오류 추세', sdOverview: '개요', sdPanelUsage: '패널 사용', sdAiCost: 'AI 비용', sdPerformance: '성능', sdErrors: '오류', sdTotalPanels: '전체 패널', sdOpenedToday: '오늘 열림', sdMostUsed: '가장 많이 사용', sdLeastUsed: '가장 적게 사용', sdTotalCost: '총 비용', sdTokensUsed: '토큰 사용량', sdRequestCount: '요청 수', sdAvgLatency: '평균 지연', sdCpuUsage: 'CPU 사용률', sdMemoryUsage: '메모리 사용률', sdFps: 'FPS', sdLoadTime: '로딩 시간', sdErrorRate: '오류율', sdErrorTrend: '오류 추세', sdRecentErrors: '최근 오류', sdLast24h: '지난 24시간', sdLast7d: '지난 7일', sdLast30d: '지난 30일', sdRefresh: '새로고침', sdExport: '내보내기', sdNoData: '데이터 없음',
  tmTitle: '테마 매니저', tmSubtitle: '테마 설정 내보내기/가져오기 및 공유 링크', tmExportJson: 'JSON 내보내기', tmImportJson: 'JSON 가져오기', tmShareLink: '공유 링크', tmCopyLink: '링크 복사', tmLinkCopied: '링크 복사됨', tmCustomThemes: '커스텀 테마', tmPresetThemes: '프리셋 테마', tmSaveTheme: '테마 저장', tmDeleteTheme: '테마 삭제', tmDeleteConfirm: '이 테마를 삭제하시겠습니까?', tmApply: '적용', tmPreview: '미리보기', tmNoCustom: '커스텀 테마 없음', tmExportSuccess: '내보내기 성공', tmImportSuccess: '가져오기 성공', tmImportError: '가져오기 실패, 잘못된 JSON', tmThemeName: '테마 이름', tmCreated: '생성일', tmColors: '색상', tmCurrentConfig: '현재 설정',
  mwTitle: '윈도우 매니저', mwSubtitle: '플로팅 패널 윈도우 및 레이아웃 동기화', mwNewWindow: '새 윈도우', mwCloseWindow: '윈도우 닫기', mwSyncWindows: '윈도우 동기화', mwDragOut: '드래그하여 분리', mwMergeBack: '다시 병합', mwTiled: '타일', mwStacked: '스택', mwGrid: '그리드', mwCustom: '커스텀', mwPosition: '위치', mwSize: '크기', mwMaximize: '최대화', mwMinimize: '최소화', mwRestore: '복원', mwMemory: '레이아웃 기억', mwRecovery: '레이아웃 복구', mwNoWindows: '플로팅 윈도우 없음', mwActiveWindows: '활성 윈도우', mwFocused: '포커스', mwLayout: '레이아웃',
  rcTitle: '실시간 협업 강화', rcSubtitle: 'yjs CRDT 심층 통합 · 충돌 해결 · 커서 추적 · 작업 리플레이', rcPresence: '프레즌스', rcConflicts: '충돌', rcOpHistory: '작업 기록', rcCursors: '커서 추적', rcOnline: '온라인', rcOfflinePeers: '오프라인', rcEditing: '편집 중', rcIdle: '유휴', rcLastSeen: '마지막 확인', rcFileLocks: '파일 잠금', rcNoConflicts: '충돌 없음', rcActive: '활성', rcResolved: '해결됨', rcAutoResolved: '자동 해결', rcLocalChanges: '로컬 변경', rcRemoteChanges: '원격 변경', rcMergedResult: '병합 결과', rcAcceptLocal: '로컬 수락', rcAcceptRemote: '원격 수락', rcAcceptBoth: '양측 수락', rcSpeed: '속도', rcNoOps: '작업 기록 없음', rcCursorDesc: '모든 협업자의 커서 위치를 실시간 추적', rcFollowing: '팔로우 중', rcStopFollowing: '팔로우 중지', rcProvider: '프로바이더', rcProtocol: '프로토콜', rcQueueSize: '큐', rcPeerCount: '피어 수', rcServerUrl: '서버 URL', rcConnectReal: '실제 서버에 연결', rcSimulated: '시뮬레이션', rcRealMode: '실제 연결', rcServerPlaceholder: 'ws://localhost:1234', rcConnectingServer: '서버에 연결 중...', rcFailedConnect: '연결 실패', rcDisconnectServer: '연결 해제', rcConnectionMode: '연결 모드',
  sbTitle: '코드 샌드박스', sbSubtitle: 'iframe 격리 실행 · HMR 핫 리로드 · 오류 바운더리 · 리소스 제한', sbEditor: '에디터', sbConsole: '콘솔', sbResources: '리소스', sbDeps: '의존성', sbRun: '실행', sbRunning: '실행 중...', sbReady: '준비 완료', sbMemLimit: '메모리 제한', sbTimeout: '타임아웃', sbHmr: 'HMR 핫 리로드', sbNetwork: '네트워크 접근', sbFileAccess: '파일 접근', sbDomAccess: 'DOM 접근', sbAutoRestart: '자동 재시작', sbConsoleOutput: '콘솔 ', sbNoOutput: '출력 없음', sbMemory: '메모리', sbExecHistory: '실행 기록', sbSecurity: '보안 제한', sbPreview: '미리보기', sbClickRun: '실행 클릭 또는 코드 입력', sbIsolation: '격리 모드', sbExecCount: '실행 횟수', sbDepsDesc: '샌드박스 환경에 로드된 의존성 패키지', sbLoaded: '로드됨', sbNotLoaded: '미로드', sbSyncToPreview: '미리보기에 동기화', sbSyncedToPreview: '미리보기 패널에 동기화됨', sbLinkedToPreview: '미리보기에 연결됨',
  vqTitle: '비주얼 쿼리 빌더', vqSubtitle: '드래그 앤 드롭 SQL · JOIN 시각화 · 쿼리 플랜 분석', vqBuilder: '빌더', vqSqlPreview: 'SQL 미리보기', vqQueryPlan: '쿼리 플랜', vqResults: '결과', vqTables: '테이블', vqColumns: '컬럼', vqJoins: 'JOIN', vqWhere: 'WHERE 조건', vqAddJoin: 'JOIN 추가', vqAddFilter: '필터 추가', vqNoColumns: '왼쪽 패널에서 컬럼 선택', vqSelectAll: '전체 선택', vqCopySQL: 'SQL 복사', vqExecute: '실행', vqExecuted: '쿼리 실행 완료', vqCopied: 'SQL 복사됨', vqCost: '비용', vqRows: '행', vqPlanDesc: 'EXPLAIN ANALYZE 시뮬레이션 기반 쿼리 실행 플랜 분석', vqTotalCost: '총 비용', vqEstRows: '예상 행수', vqEstTime: '예상 시간', vqResultsCount: '쿼리 결과', vqRunFirst: '먼저 쿼리를 실행하세요',
  // DB Index Manager & Performance
  dbIndexManager: '인덱스 관리자', dbIndexes: '인덱스', dbIndexName: '인덱스 이름', dbIndexColumns: '컬럼', dbIndexSize: '크기', dbIndexScans: '스캔 횟수', dbIndexReads: '읽기 횟수', dbIndexRecommend: '추천', dbIndexCreate: '인덱스 생성', dbIndexDrop: '인덱스 삭제', dbIndexRebuild: '재구축', dbNoIndexes: '인덱스 없음', dbIndexCreated: '인덱스 생성 완료', dbIndexDropped: '인덱스 삭제 완료', dbIndexRebuilt: '인덱스 재구축 완료', dbIndexRecommendations: '인덱스 추천',
  dbQueryAnalyzer: '쿼리 분석기', dbAnalyzeSql: 'SQL 분석', dbAnalyzingQuery: '분석 중...', dbExecTime: '실행 시간', dbRowsScanned: '스캔 행수', dbRowsReturned: '반환 행수', dbIndexUsed: '사용된 인덱스', dbQueryPlan: '쿼리 플랜', dbQueryRecommendations: '최적화 제안', dbQueryCache: '쿼리 캐시', dbCacheEntries: '항목', dbCacheHitRate: '적중률', dbCacheHits: '적중 수', dbCacheMisses: '미적중', dbSlowQueries: '슬로우 쿼리', dbSlowThreshold: '임계값', dbSlowTotal: '합계', dbSlowAvg: '평균 시간', dbSlowMax: '최대 시간', dbSlowClear: '지우기', dbNoSlowQueries: '슬로우 쿼리 없음',
  // AI Code Generation
  acgGenerate: '코드 생성', acgGenerating: '생성 중...', acgOptimize: '코드 최적화', acgOptimizing: '최적화 중...', acgExplain: '코드 설명', acgExplaining: '분석 중...', acgReview: '코드 리뷰', acgReviewing: '리뷰 중...', acgScore: '점수', acgIssues: '문제', acgSuggestions: '제안', acgNoIssues: '문제 없음', acgRunReview: '리뷰 실행', acgAutoReview: '자동 리뷰', acgImprovements: '개선 항목', acgApplyFix: '수정 적용', acgOptimized: '최적화 완료', acgReviewComplete: '리뷰 완료',
  // Brand tagline
  brandTagline: 'YYC³ AI Code — 딥스택이 지능의 새 시대를 열다',
  // ── Settings Page ──
  stTitle: '설정', stSubtitle: '앱 구성 및 환경설정 관리', stSearch: '설정 검색', stSearchPlaceholder: '설정 항목 검색...', stAccount: '계정', stAccountDesc: '프로필 및 계정 관리', stGeneral: '일반', stGeneralDesc: '테마, 언어, 에디터, 단축키', stAgents: '에이전트', stAgentsDesc: '커스텀 및 내장 에이전트 관리', stMcp: 'MCP', stMcpDesc: '모델 컨텍스트 프로토콜 연결', stModels: '모델', stModelsDesc: 'AI 제공업체 및 모델 설정', stContext: '컨텍스트', stContextDesc: '코드 인덱스, 제외 파일, 문서 세트', stChatFlow: '채팅 플로우', stChatFlowDesc: '작업 추적, 코드 리뷰, 자동 실행', stRules: '규칙 및 스킬', stRulesDesc: '개인 규칙, 프로젝트 규칙, 스킬 관리',
  stAvatar: '아바타', stUsername: '사용자 이름', stEmail: '이메일', stEditProfile: '프로필 편집', stSaveProfile: '프로필 저장',
  stBasicSettings: '기본 설정', stTheme: '테마', stThemeSystem: '시스템', stLanguageSetting: '언어', stEditorSettings: '에디터 설정', stFontFamily: '글꼴', stFontSize: '글꼴 크기', stWordWrap: '자동 줄바꿈', stTabSize: '탭 크기', stMinimap: '미니맵', stLineNumbers: '줄 번호', stShortcutSettings: '단축키 설정', stShortcutScheme: '단축키 스킴', stVscodeScheme: 'VS Code', stCursorScheme: 'Cursor', stCustomScheme: '커스텀', stCustomShortcutEditor: '커스텀 단축키 편집기', stCustomShortcutDesc: '단축키 셀을 클릭하여 새 키 조합 기록', stShortcutAction: '작업', stShortcutBinding: '단축키', stShortcutConflict: '단축키 충돌', stShortcutConflictDesc: '이 단축키가 여러 작업에 매핑되어 있습니다', stShortcutReset: '모두 초기화', stShortcutRecording: '기록 중…', stShortcutPressKeys: '키 조합을 누르세요', stImportConfig: '설정 가져오기', stImportConfigDesc: '다른 에디터에서 설정 가져오기', stImportVscode: 'VS Code에서 가져오기', stImportCursor: 'Cursor에서 가져오기', stImportWarning: '현재 설정이 덮어쓰기됩니다', stLinkOpenMethod: '링크 열기 방식', stSystemBrowser: '시스템 브라우저', stBuiltinBrowser: '내장 브라우저', stMarkdownOpenMethod: 'Markdown 열기 방식', stCodeEditorOpen: '코드 에디터', stMarkdownPreview: 'Markdown 미리보기', stNodeVersion: 'Node.js 버전', stAddNodeVersion: '버전 추가', stCurrentNode: '현재',
  stCustomAgents: '커스텀 에이전트', stBuiltinAgents: '내장 에이전트', stAddAgent: '에이전트 추가', stAgentName: '에이전트 이름', stAgentDesc: '설명', stAgentPrompt: '시스템 프롬프트', stNoAgents: '에이전트 없음',
  stMcpList: 'MCP 목록', stAddMcp: 'MCP 추가', stAddFromMarket: '마켓에서 추가', stAddManually: '수동 추가', stProjectMcp: '프로젝트 MCP', stProjectMcpDesc: '프로젝트 .ai/mcp.json 자동 로드', stMcpName: 'MCP 이름', stMcpEndpoint: '엔드포인트', stMcpType: '유형', stNoMcp: 'MCP 설정 없음',
  stProvider: '제공업체', stModel: '모델', stApiKey: 'API 키', stGetApiKey: 'API 키 가져오기', stAddModel: '모델 추가', stTestModel: '연결 테스트', stModelActive: '사용 중',
  stCodeIndex: '코드 인덱스 관리', stCodeIndexDesc: 'AI 이해력 향상을 위한 코드 인덱스 구축', stIndexProgress: '인덱스 진행률', stRefreshIndex: '인덱스 새로고침', stDeleteIndex: '인덱스 삭제', stIgnoreFiles: '제외 파일', stIgnoreFilesDesc: '추가 제외 규칙 (.gitignore 보완)', stDocSets: '문서 세트', stDocSetsDesc: 'AI 질의응답 컨텍스트로 문서 추가', stAddDocSet: '문서 세트 추가', stDocUrl: '문서 URL', stDocUpload: '문서 업로드', stNoDocSets: '문서 세트 없음',
  stTodoList: '할 일 목록', stTodoListDesc: '에이전트가 작업 진행을 추적', stAutoCollapse: '채팅 플로우 자동 접기', stAutoCollapseDesc: '완료된 작업 노드를 자동 접기 및 요약', stAutoFixCode: '코드 규약 자동 수정', stAutoFixCodeDesc: '채팅에서 감지된 코드 문제를 자동 수정', stAgentAsk: '에이전트 능동적 질문', stAgentAskDesc: '작업이 불명확할 때 에이전트가 질문', stCodeReview: '코드 리뷰', stReviewScope: '리뷰 범위', stReviewNone: '리뷰 없음', stReviewAll: '전체 리뷰', stReviewChanged: '변경사항만 리뷰', stReviewAfterJump: '리뷰 후 다음 변경으로 이동', stAutoRun: '자동 실행', stAutoRunMcp: 'MCP 자동 실행', stAutoRunMcpDesc: '에이전트 사용 시 MCP 도구 자동 실행', stCommandRunMode: '명령 실행 모드', stSandboxRun: '샌드박스 실행', stDirectRun: '직접 실행', stWhitelistCommands: '화이트리스트 명령', stTaskNotification: '작업 알림', stNotifyBanner: '배너 알림', stNotifySound: '소리 알림', stNotifyMenuBar: '메뉴바 알림', stVolume: '볼륨', stSoundComplete: '작업 완료음', stSoundWaiting: '대기음', stSoundError: '오류음', stPlaySound: '미리 듣기',
  stImportSettings: '설정 가져오기', stIncludeAgentsMd: 'AGENTS.md를 컨텍스트에 포함', stIncludeClaudeMd: 'CLAUDE.md/CLAUDE.local.md를 컨텍스트에 포함', stPersonalRules: '개인 규칙', stPersonalRulesDesc: 'AI가 대화에서 따를 커스텀 규칙', stProjectRules: '프로젝트 규칙', stProjectRulesDesc: '현재 프로젝트에만 적용되는 규칙', stSkills: '스킬', stGlobalSkills: '전역 스킬', stProjectSkills: '프로젝트 스킬', stAddRule: '규칙 생성', stAddSkill: '스킬 생성', stNoRules: '규칙 없음', stNoSkills: '스킬 없음', stRuleName: '규칙 이름', stRuleContent: '규칙 내용', stSkillName: '스킬 이름', stSkillContent: '스킬 내용', stSaved: '저장됨', stReset: '초기화', stBackToIde: 'IDE로 돌아가기',
  // Task Board P5
  tbTitle: 'AI 작업 보드', tbSubtitle: '지능형 작업 관리 및 칸반', tbSearch: '작업 검색...', tbAddTask: '작업 추가',
  tbAiInfer: 'AI 추론', tbNoChat: '분석할 채팅 메시지가 없습니다', tbNoInferred: '최근 대화에서 작업을 추론할 수 없습니다', tbInferred: 'AI 추론', tbInferError: 'AI 추론 실패', tbTasks: '개 작업',
  tbTimeline: '타임라인', tbDay: '일', tbWeek: '주', tbMonth: '월', tbDragResize: '막대 끝을 드래그하여 날짜 조정', tbDueDateUpdated: '마감일이 업데이트되었습니다', tbStartDateUpdated: '시작일이 업데이트되었습니다',
  wbUndo: '실행 취소', wbRedo: '다시 실행', wbUndone: '날짜 변경을 취소했습니다', wbRedone: '날짜 변경을 다시 실행했습니다', dependency: '의존성',
  criticalPath: '크리티컬 패스', tbCriticalPathLabel: '크리티컬', minimap: '미니맵',
  depEdit: '의존성 편집', tbDepRemoved: '의존성이 제거되었습니다', tbDepAdded: '의존성이 추가되었습니다',
  aiOptimize: 'AI 최적화', tbAiOptTitle: 'AI 크리티컬 패스 최적화 제안',
  tbAiBottleneck: '병목 감지', tbAiParallel: '병렬화 기회', tbAiOverdue: '기한 초과 중요 작업', tbAiBlocked: '차단된 중요 작업',
  miTitle: '멀티 인스턴스 관리', miWindows: '윈도우', miWorkspaces: '워크스페이스', miSessions: '세션', miIpcLog: 'IPC 로그',
  tbCycleDetected: '순환 의존성이 감지되었습니다! 이 링크를 추가할 수 없습니다.', tbCycleDesc: '이 의존성을 추가하면 순환이 생성됩니다. 의존성 그래프는 DAG여야 합니다.',
  tbExport: '내보내기', tbExported: '타임라인이 SVG로 내보내졌습니다', tbExportedSvg: '타임라인이 SVG로 내보내졌습니다', tbExportedPng: '타임라인이 PNG로 내보내졌습니다',
  tbCriticalPath: '크리티컬 패스', tbDepEdit: '의존성 편집', tbDepGraph: '의존성 그래프',
  tbAiOptimize: 'AI 최적화', tbUndone: '날짜 변경 취소됨', tbRedone: '날짜 변경 다시 실행됨',
  tbUndo: '취소', tbRedo: '다시 실행', tbMinimap: '미니맵', tbVector: '(벡터)', tbRaster: '(래스터 2x)',
  tbTodo: '할 일', tbInProgress: '진행 중', tbReview: '리뷰', tbDone: '완료', tbBlocked: '차단됨',
  tbCritical: '긴급', tbHigh: '높음', tbMedium: '보통', tbLow: '낮음',
  tbFeature: '기능', tbBug: '버그', tbRefactor: '리팩토링', tbTest: '테스트', tbDocumentation: '문서', tbOther: '기타',
  tbEditTask: '작업 편집', tbSave: '저장', tbSaved: '저장됨', tbEstimated: '예상 시간(h)',
  tbCreate: '생성', tbCancel: '취소', tbDelete: '삭제', tbArchive: '보관',
}