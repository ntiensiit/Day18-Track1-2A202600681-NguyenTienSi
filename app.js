(() => {
  const state = {
    workflow: 'none',
    previewEnabled: true,
    rating: null,
    selectedRecovery: 'retry',
    revoked: false,
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const views = ['onboarding', 'brief', 'review', 'recovery', 'feedback', 'scenarios'];

  function toast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.remove('hidden');
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => node.classList.add('hidden'), 3600);
  }

  function setProgress(view) {
    const assist = $('#progress-assist');
    const review = $('#progress-review');
    const recover = $('#progress-recover');
    [assist, review, recover].forEach(el => el.classList.remove('active', 'done'));
    if (view === 'brief') assist.classList.add('active');
    else if (view === 'review') { assist.classList.add('done'); assist.querySelector('span').textContent = '✓'; review.classList.add('active'); }
    else if (view === 'recovery' || view === 'feedback') { assist.classList.add('done'); assist.querySelector('span').textContent = '✓'; review.classList.add('done'); review.querySelector('span').textContent = '✓'; recover.classList.add('active'); }
    else { assist.classList.add('active'); }
  }

  function showView(view) {
    if (!views.includes(view)) return;
    $$('.view').forEach(el => el.classList.remove('active'));
    $(`#view-${view}`).classList.add('active');
    $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
    setProgress(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateWorkflow() {
    const isSd = state.workflow === 'sd15';
    $('#workflow-display').textContent = isSd ? 'SD1.5 realism' : 'Sim-only';
    $('#workflow-subtext').textContent = isSd ? 'Cần backend diffusion và chi phí GPU/API' : 'Đã chọn sau khi AI hỏi';
    $('#realism-warning').textContent = isSd ? 'Backend cần được kiểm tra trước khi sinh ảnh.' : 'Sim-only không xác nhận được độ gần ảnh thật.';
    const evidence = $('#evidence-content');
    evidence.innerHTML = isSd
      ? `<div class="evidence-item"><span>01</span><p><strong>Fact</strong> — brief có “mug”, “300 ảnh”, “train YOLO”.</p></div>
         <div class="evidence-item"><span>02</span><p><strong>Decision</strong> — bạn đã chọn SD1.5 sau khi xem trade-off.</p></div>
         <div class="evidence-item"><span>03</span><p><strong>Constraint</strong> — phải xác nhận backend trước khi tạo dataset.</p></div>`
      : `<div class="evidence-item"><span>01</span><p><strong>Fact</strong> — brief có “mug”, “300 ảnh”, “train YOLO”.</p></div>
         <div class="evidence-item"><span>02</span><p><strong>Assumption</strong> — “nhìn thật hơn” chưa đủ để tự chọn SD1.5.</p></div>
         <div class="evidence-item"><span>03</span><p><strong>Constraint</strong> — SD1.5 cần backend; nếu không sẵn sàng, job phải dừng trước khi sinh dữ liệu.</p></div>`;
  }

  $$('.nav-item').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  $$('[data-go]').forEach(button => button.addEventListener('click', event => {
    if (button.tagName === 'A') event.preventDefault();
    showView(button.dataset.go);
  }));
  $('#open-scenarios').addEventListener('click', () => showView('scenarios'));

  $('#show-boundaries').addEventListener('click', () => $('#boundary-panel').classList.toggle('hidden'));
  $('#revoke-context').addEventListener('click', () => {
    state.revoked = !state.revoked;
    $('#revoke-context').textContent = state.revoked ? 'Đã rút quyền trong phiên' : 'Rút quyền dùng brief';
    toast(state.revoked ? 'Copilot sẽ không dùng brief hiện tại để tạo đề xuất mới trong phiên này.' : 'Quyền dùng brief đã được bật lại cho prototype.');
  });

  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $('#brief-input').value = chip.dataset.fill;
    toast('Đã chèn một ví dụ đầu vào. Bạn vẫn có thể sửa trước khi phân tích.');
  }));
  $('#edit-interpretation').addEventListener('click', () => {
    $('#brief-input').focus();
    $('#brief-input').select();
    toast('Hãy sửa brief để thay đổi cách Copilot hiểu mục tiêu của bạn.');
  });
  $('#analyze-brief').addEventListener('click', () => {
    const text = $('#brief-input').value.trim();
    if (!text) { toast('Cần có một brief ngắn để Copilot tạo draft.'); return; }
    toast('Copilot giữ lại điều đã hiểu và chỉ hỏi lựa chọn ảnh hưởng mạnh đến chi phí/chất lượng.');
    $('#clarifier').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $$('input[name="workflow"]').forEach(input => input.addEventListener('change', () => {
    state.workflow = input.value;
    $$('.choice').forEach(label => label.classList.toggle('selected', label.querySelector('input').checked));
    updateWorkflow();
    toast(state.workflow === 'sd15' ? 'SD1.5 được chọn. Copilot sẽ kiểm tra backend trước khi tạo dữ liệu.' : 'Sim-only được chọn. Bản kế hoạch sẽ không cần backend diffusion.');
  }));
  $('#continue-review').addEventListener('click', () => { updateWorkflow(); showView('review'); });

  $('#undo-preview').addEventListener('click', () => {
    state.previewEnabled = false;
    $('#act-banner').innerHTML = `<span class="icon caution">↶</span><div><strong>Preview 5 ảnh đã được hoàn tác</strong><p>Không có ảnh nào được sinh từ thao tác này. Bạn có thể thêm lại sau.</p></div><button class="button button-small" id="restore-preview">Thêm lại</button>`;
    $('#restore-preview').addEventListener('click', restorePreview);
    toast('Đã hoàn tác hành động rủi ro thấp.');
  });
  function restorePreview() {
    state.previewEnabled = true;
    $('#act-banner').innerHTML = `<span class="icon good">✓</span><div><strong>AI đã tự thêm 5 ảnh preview</strong><p>Đây là hành động rủi ro thấp, không tốn GPU và có thể hoàn tác trước khi chạy job.</p></div><button class="button button-small" id="undo-preview">Hoàn tác</button>`;
    $('#undo-preview').addEventListener('click', () => {
      state.previewEnabled = false;
      $('#act-banner').innerHTML = `<span class="icon caution">↶</span><div><strong>Preview 5 ảnh đã được hoàn tác</strong><p>Không có ảnh nào được sinh từ thao tác này. Bạn có thể thêm lại sau.</p></div><button class="button button-small" id="restore-preview">Thêm lại</button>`;
      $('#restore-preview').addEventListener('click', restorePreview);
      toast('Đã hoàn tác hành động rủi ro thấp.');
    });
    toast('Preview đã được thêm lại vào draft.');
  }
  const detailCopy = {
    objects: `<p><strong>Evidence:</strong> C2-App-013 nêu <code>mug</code> trong danh sách 7 YCB tabletop objects và API demo minh họa <code>"objects": ["mug"]</code>.</p><p>Đây là dữ kiện từ domain source, không phải suy luận của Copilot.</p>`,
    preset: `<p><strong>Logic:</strong> Copilot tạo bản nháp với object đã xác nhận và một preview nhỏ để người dùng thấy kết quả trước. Nó không tự thay đổi training benchmark hay golden dataset.</p>`,
    cost: `<p><strong>Trade-off:</strong> workflow SD1.5 có thể tăng realism nhưng phụ thuộc diffusion backend. Nếu backend lỗi, Copilot không được âm thầm chuyển workflow đầy đủ sang sim-only.</p><ul><li>Chi phí: cao hơn sim-only.</li><li>Độ chắc chắn: chỉ có sau bước kiểm tra backend.</li><li>Khôi phục: thử lại, tạo preview sim-only hoặc lưu draft.</li></ul>`
  };
  $$('.details-trigger').forEach(button => button.addEventListener('click', () => {
    $('#modal-copy').innerHTML = detailCopy[button.dataset.details];
    $('#evidence-modal').classList.remove('hidden');
  }));
  $('.modal-close').addEventListener('click', () => $('#evidence-modal').classList.add('hidden'));
  $('#evidence-modal').addEventListener('click', event => { if (event.target === $('#evidence-modal')) $('#evidence-modal').classList.add('hidden'); });
  $('#back-to-brief').addEventListener('click', () => showView('brief'));
  $('#reset-draft').addEventListener('click', () => { toast('Draft đã được xóa trong prototype. Không có job hay dữ liệu nào bị xóa.'); showView('brief'); });
  $('#approve-job').addEventListener('click', () => {
    if (state.workflow === 'sd15') {
      toast('Đang mô phỏng kiểm tra backend SD1.5. Prototype chuyển tới nhánh failure để minh họa khôi phục.');
      showView('recovery');
      return;
    }
    toast('Sim-only draft đã qua kiểm tra cấu hình. Prototype không gọi GPU/API hay tạo dữ liệu thật.');
    showView('feedback');
  });

  $$('.recovery-option').forEach(button => button.addEventListener('click', () => {
    state.selectedRecovery = button.dataset.recovery;
    $$('.recovery-option').forEach(el => el.classList.toggle('selected', el === button));
    const config = {
      retry: ['Thử kiểm tra lại', 'Giữ ý định SD1.5; chưa tạo dữ liệu cho tới khi backend trả lời.'],
      switch: ['Tạo preview sim-only', 'Chỉ sinh 5 ảnh preview; bạn sẽ đánh giá trước khi chạy dataset đầy đủ.'],
      save: ['Lưu draft an toàn', 'Không gọi backend, không dùng GPU/API. Bạn có thể quay lại khi sẵn sàng.']
    };
    $('#recover-action').textContent = config[state.selectedRecovery][0];
    $('#recovery-footnote').textContent = config[state.selectedRecovery][1];
  }));
  $('#recover-action').addEventListener('click', () => {
    const messages = {
      retry: 'Kiểm tra lại vẫn là draft: Copilot chỉ báo trạng thái, không tự chạy fallback.',
      switch: 'Đã chuyển sang preview sim-only 5 ảnh. Full dataset vẫn cần bạn duyệt lại.',
      save: 'Draft đã được giữ nguyên. Không có dữ liệu, chi phí hoặc thao tác nền nào phát sinh.'
    };
    toast(messages[state.selectedRecovery]);
  });
  $('#confirm-mapping').addEventListener('click', () => {
    $('#repair-result').classList.remove('hidden');
    toast('Đã xác nhận mapping cho job này. Đây là explicit feedback, không phải một quy tắc chung.');
  });
  $('#change-object').addEventListener('click', () => { toast('Bạn có thể quay lại brief để chọn object từ registry thay vì để Copilot tự map.'); showView('brief'); });

  $$('.rating').forEach(button => button.addEventListener('click', () => {
    state.rating = button.dataset.rating;
    $$('.rating').forEach(item => item.classList.toggle('selected', item === button));
  }));
  $('#send-feedback').addEventListener('click', () => {
    if (!state.rating && !$('#feedback-note').value.trim()) { toast('Chọn một đánh giá hoặc ghi một nhận xét trước khi gửi.'); return; }
    $('#feedback-confirm').classList.remove('hidden');
    toast('Feedback đã được ghi nhận cho đánh giá prototype.');
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') $('#evidence-modal').classList.add('hidden');
  });

  updateWorkflow();
})();
