## caribou ― deneysel bir proje

Bu branch altında caribou-server opensubtitles REST API kullanılarak baştan yazılmakta. Branchta yapılmak istenen crawler işlemine gerek kalmadan Opensubtitles REST API üzerinden indirilen altyazı dosyalarını işleyen bir queue geliştirmek ve altyazı dosyalarını statik olarak tutmadan MongoDB üzerinde metadata değerlerini ve içerikteki en sık kullanılan kelimeleri tutarak client tarafına veri sağlamaktır.

Servis dinamik olarak çalışacağından dolayı istekler kullanıcının yaptığı arama üzerinden tetiklenecek ve sunucu tarafında olabildiğince manuel işlemlerden kaçınılacaktır.

Sunucunun izleyeceği senaryo aşağıdaki gibidir:

- Kullanıcı bir film içeriği arar: içerik MongoDB üzerinde aranır, eğer film içeriği:
    - yoksa, opensubtitles üzerinde sorgulanır ve altyazı dosyası indirilir ve işlenerek veritabanına kaydedilir
    - varsa, 