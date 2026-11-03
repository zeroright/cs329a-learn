(function(){
  function vars(dark){
    if(dark){
      return {
        primaryColor:'#1e293b', primaryTextColor:'#e8ecf7', primaryBorderColor:'#60a5fa',
        lineColor:'#94a3b8', secondaryColor:'#312e81', tertiaryColor:'#064e3b',
        background:'#121a2f', mainBkg:'#1e293b', nodeBorder:'#60a5fa', clusterBkg:'#0b1020',
        titleColor:'#e8ecf7', edgeLabelBackground:'#121a2f'
      };
    }
    return {
      primaryColor:'#dbeafe', primaryTextColor:'#1a1d26', primaryBorderColor:'#2563eb',
      lineColor:'#64748b', secondaryColor:'#ede9fe', tertiaryColor:'#d1fae5',
      background:'#ffffff', mainBkg:'#eff6ff', nodeBorder:'#2563eb', clusterBkg:'#f8fafc',
      titleColor:'#1a1d26', edgeLabelBackground:'#ffffff'
    };
  }
  window.CS329A_mermaidInit=function(){
    if(!window.mermaid) return;
    const dark=document.documentElement.getAttribute('data-theme')==='dark';
    mermaid.initialize({startOnLoad:false, theme:'base', themeVariables:vars(dark), securityLevel:'loose'});
  };
})();
