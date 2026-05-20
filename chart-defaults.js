// Chart.js 공통 다크모드 설정
// 사용: <script src="chart-defaults.js"></script> (Chart.js 로드 이후)
// CSS 변수(--chart-grid 등)를 읽어 Chart.defaults에 적용 + 시스템 모드 변경 시 자동 재적용

(function(){
  if(typeof Chart==='undefined')return;

  function cssVar(name){
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function applyTheme(){
    const grid=cssVar('--chart-grid')||'#f3f4f6';
    const axis=cssVar('--chart-axis')||'#6b7280';

    Chart.defaults.color=axis;
    Chart.defaults.borderColor=grid;
    Chart.defaults.scale=Chart.defaults.scale||{};
    if(Chart.defaults.scales){
      Object.keys(Chart.defaults.scales).forEach(k=>{
        const s=Chart.defaults.scales[k];
        if(s.grid)s.grid.color=grid;
        if(s.ticks)s.ticks.color=axis;
      });
    }

    // 이미 생성된 차트 갱신
    if(Chart.instances){
      Object.values(Chart.instances).forEach(c=>{
        try{
          if(c.options.scales){
            Object.values(c.options.scales).forEach(s=>{
              if(s.grid&&s.grid.color&&s.grid.color!==false)s.grid.color=grid;
              if(s.ticks)s.ticks.color=axis;
            });
          }
          c.update('none');
        }catch(e){}
      });
    }
  }

  applyTheme();

  // 시스템 다크/라이트 토글 시 즉시 재적용
  if(window.matchMedia){
    const mq=window.matchMedia('(prefers-color-scheme: dark)');
    if(mq.addEventListener)mq.addEventListener('change',applyTheme);
    else if(mq.addListener)mq.addListener(applyTheme);
  }

  // 외부에서 접근 가능하도록 노출 (선택 색상 등 동적으로 받을 때)
  window.chartTheme={
    grid:()=>cssVar('--chart-grid'),
    axis:()=>cssVar('--chart-axis'),
    pointBorder:()=>cssVar('--chart-point-border'),
    muted:()=>cssVar('--chart-muted'),
    apply:applyTheme
  };
})();
