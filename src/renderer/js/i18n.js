// Internationalization support
const translations = {
  ja: {
    // Main window
    app_title: '3D地震観測',
    main_description: 'このアプリケーションは気象庁の地震データを3Dで可視化します。',
    windows_info: '異なる表示とコントロールのための複数のウィンドウが利用可能です。',
    
    // Table window
    table_title: '地震データ',
    datetime: '日時',
    latitude: '緯度',
    longitude: '経度',
    depth: '深さ (km)',
    magnitude: 'マグニチュード',
    epicenter: '震央',
    loading: '読み込み中...',
    no_data: '地震データがありません',
    
    // Filter window
    filter_title: 'フィルター設定',
    region_filter: '地域フィルター:',
    all_regions: '全ての地域',
    magnitude_range: 'マグニチュード範囲:',
    time_range: '時間範囲:',
    apply_filter: 'フィルターを適用',
    reset_filter: 'フィルターをリセット',
    
    // Control window
    control_title: 'コントロールパネル',
    data_controls: 'データ操作',
    refresh: '更新',
    check_updates: '更新をチェック',
    auto_update: '自動更新 (30分)',
    visual_controls: '表示制御',
    sphere_size: '球体サイズ:',
    sphere_transparency: '球体透明度:',
    language_settings: '言語設定',
    
    // 3D Visualization window
    viz_title: '3D地震可視化',
    legend: '凡例:',
    recent_earthquakes: '最近 (0-12時間)',
    older_earthquakes: '古い (12時間以上)',
    sphere_size_legend: '球体サイズ:',
    magnitude_proportional: 'マグニチュードに比例',
    controls: '操作:',
    mouse_rotate: 'マウス: 視点回転',
    mouse_zoom: 'スクロール: ズームイン/アウト',
    mouse_pan: '右クリック + ドラッグ: パン',
    loading_3d: '3Dシーンを読み込み中...',
    
    // Calendar window
    previous: '‹ 前',
    next: '次 ›',
    sun: '日',
    mon: '月',
    tue: '火',
    wed: '水',
    thu: '木',
    fri: '金',
    sat: '土',
    low_activity: '低 (1-2)',
    medium_activity: '中 (3-5)',
    high_activity: '高 (6+)',
    no_calendar_data: 'この月の地震データはありません',
    
    // Progress messages
    loading_data: 'データを読み込み中...',
    fetching_data: 'データを取得中...',
    processing_data: 'データを処理中...',
    fetching_terrain: '地形データを取得中...',
    data_complete: 'データ読み込み完了',
    
    // Tab labels
    overview_tab: '概要',
    data_table_tab: 'データテーブル',
    visualization_tab: '3D表示',
    calendar_tab: 'カレンダー',
    
    // Welcome messages
    welcome_title: '3D地震可視化へようこそ',
    welcome_description: '上のタブを使用して、さまざまなビューで地震データを探索してください。',
    welcome_instruction: 'データテーブルまたは3D表示タブから始めてください。'
  },
  
  en: {
    // Main window
    app_title: '3D Earthquake Observation',
    main_description: 'This application visualizes earthquake data from JMA in 3D.',
    windows_info: 'Multiple windows are available for different views and controls.',
    
    // Table window
    table_title: 'Earthquake Data',
    datetime: 'Date/Time',
    latitude: 'Latitude',
    longitude: 'Longitude',
    depth: 'Depth (km)',
    magnitude: 'Magnitude',
    epicenter: 'Epicenter',
    loading: 'Loading...',
    no_data: 'No earthquake data available',
    
    // Filter window
    filter_title: 'Filter Settings',
    region_filter: 'Region Filter:',
    all_regions: 'All Regions',
    magnitude_range: 'Magnitude Range:',
    time_range: 'Time Range:',
    apply_filter: 'Apply Filter',
    reset_filter: 'Reset Filter',
    
    // Control window
    control_title: 'Control Panel',
    data_controls: 'Data Controls',
    refresh: 'Refresh',
    check_updates: 'Check Updates',
    auto_update: 'Auto-update (30 min)',
    visual_controls: 'Visual Controls',
    sphere_size: 'Sphere Size:',
    sphere_transparency: 'Sphere Transparency:',
    language_settings: 'Language Settings',
    
    // 3D Visualization window
    viz_title: '3D Earthquake Visualization',
    legend: 'Legend:',
    recent_earthquakes: 'Recent (0-12h)',
    older_earthquakes: 'Older (12h+)',
    sphere_size_legend: 'Sphere Size:',
    magnitude_proportional: 'Proportional to magnitude',
    controls: 'Controls:',
    mouse_rotate: 'Mouse: Rotate view',
    mouse_zoom: 'Scroll: Zoom in/out',
    mouse_pan: 'Right-click + drag: Pan',
    loading_3d: 'Loading 3D scene...',
    
    // Calendar window
    previous: '‹ Previous',
    next: 'Next ›',
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    low_activity: 'Low (1-2)',
    medium_activity: 'Medium (3-5)',
    high_activity: 'High (6+)',
    no_calendar_data: 'No earthquake data available for this month',
    
    // Progress messages
    loading_data: 'Loading data...',
    fetching_data: 'Fetching data...',
    processing_data: 'Processing data...',
    fetching_terrain: 'Fetching terrain data...',
    data_complete: 'Data loading complete',
    
    // Tab labels
    overview_tab: 'Overview',
    data_table_tab: 'Data Table',
    visualization_tab: '3D View',
    calendar_tab: 'Calendar',
    
    // Welcome messages
    welcome_title: 'Welcome to 3D Earthquake Visualization',
    welcome_description: 'Use the tabs above to explore earthquake data in different views.',
    welcome_instruction: 'Start by checking the Data Table or 3D View tabs.'
  }
};

let currentLanguage = 'ja';

function initializeI18n() {
  // Set initial language based on system or stored preference
  const savedLanguage = localStorage.getItem('language') || 'ja';
  updateLanguage(savedLanguage);
}

function updateLanguage(language) {
  currentLanguage = language;
  localStorage.setItem('language', language);
  
  // Update all elements with data-i18n-key attribute
  document.querySelectorAll('[data-i18n-key]').forEach(element => {
    const key = element.getAttribute('data-i18n-key');
    if (translations[language] && translations[language][key]) {
      element.textContent = translations[language][key];
    }
  });
}

function t(key) {
  return translations[currentLanguage] && translations[currentLanguage][key] 
    ? translations[currentLanguage][key] 
    : key;
}