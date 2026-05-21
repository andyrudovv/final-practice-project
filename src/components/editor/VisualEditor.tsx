"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface VisualEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const STYLE_ID = "ve-style";
const SCRIPT_ID = "ve-script";

function buildInjectedCode(): string {
  return `
    <style id="${STYLE_ID}">
      [contenteditable="true"]:focus, [data-editable]:focus {
        outline: 2px solid #6366f1 !important; outline-offset: 2px; border-radius: 2px;
      }
      [contenteditable="true"]:hover, [data-editable]:hover,
      input:hover, select:hover, textarea:hover {
        outline: 1px dashed #a5b4fc !important; outline-offset: 1px;
      }
      .ve-sel { outline: 2px solid #6366f1 !important; outline-offset: 2px; }
      .ve-drg { border: 2px dashed #6366f1 !important; background: rgba(99,102,241,0.05) !important; }
    </style>
    <script id="${SCRIPT_ID}">
    (function(){
      function init(){
        var body = document.body;
        if(!body) return;

        // Mark elements that already have contenteditable
        body.querySelectorAll('[contenteditable="true"]').forEach(function(el){
          el.setAttribute('data-oce','1');
        });

        // Make text elements editable
        body.querySelectorAll('p,h1,h2,h3,h4,h5,h6,span,div,td,th,li,label,figcaption,blockquote,dt,dd').forEach(function(el){
          if(!el.querySelector('input,select,textarea,button,iframe,script,style') && !el.closest('[contenteditable="true"]')){
            if(el.children.length===0 || el.textContent.trim().length>0){
              el.setAttribute('contenteditable','true');
            }
          }
        });

        // Sync all form field values into HTML attributes so cloneNode captures them
        function syncFormValues(){
          document.querySelectorAll('input,textarea,select').forEach(function(el){
            if(el.tagName==='SELECT'){
              // Set selected attribute on the right option
              var opts = el.querySelectorAll('option');
              opts.forEach(function(opt){ opt.removeAttribute('selected'); });
              if(el.selectedIndex>=0 && opts[el.selectedIndex]){
                opts[el.selectedIndex].setAttribute('selected','selected');
              }
            } else if(el.type==='checkbox' || el.type==='radio'){
              if(el.checked) el.setAttribute('checked','checked');
              else el.removeAttribute('checked');
            } else {
              el.setAttribute('value', el.value);
            }
          });
          // Also sync textarea content
          document.querySelectorAll('textarea').forEach(function(el){
            el.textContent = el.value;
          });
        }

        function getCleanHtml(){
          syncFormValues();
          var clone = document.documentElement.cloneNode(true);
          var s1 = clone.querySelector('#${STYLE_ID}');
          var s2 = clone.querySelector('#${SCRIPT_ID}');
          if(s1) s1.remove();
          if(s2) s2.remove();
          clone.querySelectorAll('.ve-sel').forEach(function(e){ e.classList.remove('ve-sel'); });
          clone.querySelectorAll('[draggable="true"]').forEach(function(e){ e.removeAttribute('draggable'); });
          clone.querySelectorAll('[contenteditable]').forEach(function(e){
            if(!e.getAttribute('data-oce')) e.removeAttribute('contenteditable');
          });
          clone.querySelectorAll('[data-oce]').forEach(function(e){ e.removeAttribute('data-oce'); });
          return '<!DOCTYPE html>\\n' + clone.outerHTML;
        }

        var timer = null;
        function notify(){
          clearTimeout(timer);
          timer = setTimeout(function(){
            window.parent.postMessage({type:'ve-change', html:getCleanHtml()}, '*');
          }, 250);
        }

        // Listen on body for contenteditable changes
        body.addEventListener('input', notify);

        // Listen directly on all form fields
        document.querySelectorAll('input,select,textarea').forEach(function(el){
          el.addEventListener('input', notify);
          el.addEventListener('change', notify);
        });

        // Selection highlight
        body.addEventListener('click', function(e){
          body.querySelectorAll('.ve-sel').forEach(function(el){ el.classList.remove('ve-sel'); });
          var t = e.target;
          if(t && t!==body){
            t.classList.add('ve-sel');
            window.parent.postMessage({type:'ve-select',tag:t.tagName,text:(t.textContent||'').substring(0,50),editable:t.contentEditable==='true'},'*');
          }
        });

        // Drag and drop
        body.querySelectorAll('div,section,article,p,h1,h2,h3,h4,h5,h6,table,ul,ol').forEach(function(el){
          if(el.parentElement===body||(el.parentElement&&el.parentElement.children.length>1)){
            el.setAttribute('draggable','true');
            el.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain','');e.dataTransfer.effectAllowed='move';this.style.opacity='0.4';});
            el.addEventListener('dragend',function(){this.style.opacity='';document.querySelectorAll('.ve-drg').forEach(function(x){x.classList.remove('ve-drg');});});
            el.addEventListener('dragover',function(e){e.preventDefault();e.dataTransfer.dropEffect='move';this.classList.add('ve-drg');});
            el.addEventListener('dragleave',function(){this.classList.remove('ve-drg');});
            el.addEventListener('drop',function(e){
              e.preventDefault();this.classList.remove('ve-drg');
              var src=document.querySelector('[style*="opacity"]');
              if(src&&src!==this&&this.parentNode){this.parentNode.insertBefore(src,this);src.style.opacity='';notify();}
            });
          }
        });

        // Also notify parent immediately when parent requests current state
        window.addEventListener('message',function(e){
          if(e.data&&e.data.type==='ve-get-html'){
            window.parent.postMessage({type:'ve-change',html:getCleanHtml()},'*');
          }
        });
      }

      if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
      else init();
    })();
    </script>
  `;
}

export default function VisualEditor({ value, onChange }: VisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const internalHtmlRef = useRef<string>("");
  const initialLoadDone = useRef(false);

  const buildSrcDoc = useCallback((html: string) => {
    const insertPoint = html.lastIndexOf("</body>");
    const code = buildInjectedCode();
    if (insertPoint === -1) return html + code;
    return html.substring(0, insertPoint) + code + html.substring(insertPoint);
  }, []);

  const [srcDoc, setSrcDoc] = useState(() => buildSrcDoc(value));

  useEffect(() => {
    if (internalHtmlRef.current && value === internalHtmlRef.current) return;
    if (initialLoadDone.current) {
      setSrcDoc(buildSrcDoc(value));
    }
    initialLoadDone.current = true;
  }, [value, buildSrcDoc]);

  // Request fresh HTML from iframe before saves (flush any pending edits)
  const requestFreshHtml = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "ve-get-html" }, "*");
    }
  }, []);

  // Expose requestFreshHtml so parent can call it before saving
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__veFlush = requestFreshHtml;
    return () => { delete (window as unknown as Record<string, unknown>).__veFlush; };
  }, [requestFreshHtml]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "ve-change") {
        internalHtmlRef.current = e.data.html;
        onChange(e.data.html);
      }
      if (e.data?.type === "ve-select") {
        setSelectedElement(
          `<${e.data.tag.toLowerCase()}> ${e.data.editable ? "(editable)" : ""} — ${e.data.text || ""}`
        );
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onChange]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2">
        <span className="text-xs font-medium text-gray-500">Visual Editor</span>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-xs text-gray-400">
          Click to select, edit text directly, drag blocks to reorder
        </span>
        {selectedElement && (
          <>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-xs text-indigo-600 truncate max-w-xs">{selectedElement}</span>
          </>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="mx-auto max-w-4xl">
          <iframe
            ref={iframeRef}
            srcDoc={srcDoc}
            className="w-full rounded-lg border border-gray-200 bg-white shadow-sm"
            style={{ minHeight: "calc(100vh - 220px)" }}
            sandbox="allow-same-origin allow-scripts"
            title="Visual editor"
          />
        </div>
      </div>
    </div>
  );
}
