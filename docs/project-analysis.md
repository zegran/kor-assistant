# Kor Assistant — Amaç, Mevcut Durum, Hedef ve Senior Analiz Checklist’i

## Projenin amacı
Günlük ve iş hayatı dahil yapılacak tüm işleri tek bir yerde listeleyen, önceliklendiren, takvim ile birlikte takip eden, tek kullanıcılı kişisel iş takip yazılımı. Android’de çalışır, web fallback ile kullanılabilir. (Öncelik: güvenilir kalıcılık ve hızlı aksiyonlar.)

## Şu anki durum (spec ve dokümanlardan gözlenen)
- **Local-first “Vault” yaklaşımı**: tüm state tek JSON objesinde tasarlanmış.
- **UI yönü**: mobile-first, dense UI, Obsidian/Glass tasarım dili, akordiyon Kanban mantığı.
- **Domain modelleri**: Task + Node (Evren) + TaskLog; notes → logs migrasyonu düşünülmüş.
- **Sync**: Drive + local cache hedeflenmiş, LWW (last-write-wins) mantığı belgelenmiş.
- **Sürtünmeler**: race condition, CORS, log büyümesi gibi problemler belgelenmiş.

## Hedef durum (senior hedef)
- **Tek kullanıcı güvenli kullanım**: veri kaybına dayanıklı, atomic write, recoverable, opsiyonel şifreleme.
- **Tek DB dosyası gerçeği**: Android SAF ile gerçek dosyaya okuma/yazma, web fallback.
- **Sync çalışan sistem**: startup pull, auto push, user manual sync, tek inFlight, sağlam hata raporu.
- **UI/UX serbest geliştirme**: dense list, hızlı aksiyonlar, akordiyon kanban, takvim dolu, evrenler dolu, admin panel gerçekten çalışır.

## Kritik gap listesi
1. **Storage gerçekliği**: DB seçimi, open vs save ayrımı; dosyadan okuyup hydrate etme güvenilir değil.
2. **Persist garantisi**: “yazdım” iddiası ile gerçek kalıcılık uyuşmuyor.
3. **Selectors ve veri kontratı**: Inbox/Calendar/Universes boşsa veri mi yok, seçici mi yanlış, migration mı kırık belirsiz.
4. **SyncManager + DriveSync**: hata ve durum görünür ama gerçek IO tutarsız.
5. **Schema + migration disiplini**: alanlar değiştikçe eski DB açma güveni düşer.
6. **Observability**: debug log var ama akışlar “kanıt” üretmiyor.

## Komple codebase analizi nasıl yapılmalı (Senior to Senior, “answer-first”)
Aşağıdaki analiz, kazanımları bozmadan refactor için zorunlu kontrol listesidir. Her madde **“kanıt” logu** üretir.

### A) Build ve runtime topolojisi
- React SPA çalışma modu, router, entrypoint, platform ayrımı (web vs capacitor).
- Android wrapper hedefi: SAF plugin, permission persist, lifecycle.

### B) Veri yaşam döngüsü
- **Single source of truth**: Vault nerede tutuluyor, kim güncelliyor.
- **Startup order**:
  1) handle load
  2) file read
  3) local cache fallback
  4) migrate
  5) setState
  6) sync startup pull
- **Write order**:
  1) state update
  2) local cache write
  3) file write
  4) sync enqueue

### C) Storage adapter gerçeği
- Android SAF read/write gerçekten çalışıyor mu.
- Web fallback localStorage net mi.
- “Mevcut kullanıcı” akışı open file mı, save picker mı.

### D) Feature gating ve servis sınırları
- Drive/Gemini/Voice/Camera kapalıyken UI ve servis çağrıları gerçekten devre dışı mı.

### E) UI data contract ve selector katmanı
- Inbox selector: tüm tasks, updatedAt desc.
- Calendar selector: dueAt bazlı gün eşlemesi.
- Universes selector: nodes list ve task count.

### F) Regression test matrisi
- 360x740
- cold start, warm start
- open existing DB, create new DB
- add task, update status, add log
- inbox dolu, kanban dolu, calendar dolu, universes dolu
- sync startup pull ve manual sync

## Kazanımları bozmadan geliştirme stratejisi
“**Kırmadan**” ilerlemek için tek yöntem: kontrat kilitle, adaptörleri değiştir, UI’yi selectors üzerinden besle.

### 1) Kontratları kilitle
- **VaultData stabil**: meta + profile + nodes + tasks + settings.
- **Task minimum alanlar**: id, title, status, nodeId, updatedAt, dueAt, logs[].
- **Node**: id, title, createdAt, updatedAt.

> Bu kontrat, mevcut “Task logs + Kanban + Dense UI” kazanımını korur.

### 2) Selector-first UI
UI hiçbir zaman `vault.tasks` ile doğrudan oynamasın.

- `selectInboxRows(vault)`
- `selectCalendarDay(vault, day)`
- `selectNodes(vault)` ve `selectNodeTaskCounts(vault)`

> Bu, “Inbox boş” ve “Takvim boş” gibi semptomları deterministik debug etmeyi sağlar.

### 3) Storage adapter izolasyonu
**VaultStorage interface**:
- `openExisting(): Promise<{ vault, handle }>`
- `createNew(): Promise<{ vault, handle }>`
- `read(handle)`
- `write(handle, vault)`

Android SAF ve Web fallback ayrı dosyalarda.

> Bu, “mevcut kullanıcı open yerine save picker çıkıyor” hatasını kökten çözer.

### 4) Write pipeline tekleştir
UI’dan gelen her değişiklik:
1) `applyMutation(vault, mutation)` saf fonksiyon
2) `touchMeta(vault)`
3) `persistQueue.enqueue(() => persistAll(vault))`
4) `syncManager.requestSync('auto')` (driveEnabled ise)

> Race condition problemleri bu noktada tek akışa alınır.

### 5) Sync’i IO gerçekliğine bağla
Sync sadece iki fonksiyon bilsin:
- `drivePull()`
- `drivePush(vault)`

**SyncManager**:
- tek inFlight
- pending flag
- startup pull
- auto push debounce
- manual sync bypass

## UI/UX ve frontend geliştirme izni ile önerilen yükseltmeler
### UI sistem iyileştirmeleri
- Overlay contract ve portal root kalıcı kural (z-index, sheet, modal, overlay).
- “Boş ekran” yerine durum göster:
  - “DB açılmadı”
  - “DB okunamadı, recovery”
  - “0 görev”
- Admin panel gerçek telemetri:
  - DB mode: saf | localStorage
  - lastLocalWriteAt
  - lastDriveSyncAt/status/error

### Inbox satır kalitesi
- Tek satır string + marquee sadece taşmada.
- Sağda küçük due etiketi.
- Status label map kesin.

### Calendar görünümü
- “day agenda list” empty yerine “Bu gün planlı görev yok”.
- `dueAt` yoksa Calendar’a girmez, Inbox’ta görünür.

### Universes görünümü
Node list her satırda:
- title
- aktif görev sayısı
- edit

Node delete: `task.nodeId` migrate default.
