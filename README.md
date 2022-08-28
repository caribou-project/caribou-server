## caribou ― deneysel bir proje

Projenin amacı: film ve dizilerin altyazı dosyalarındaki kelimeleri işleyerek sıklıklarına göre sıralamak ve dil öğrenme konusunda yardımcı bir araç oluşturmak.

## Evre 1 ― Veri toplama (crawler)

Bu aşamada opensubtitles.org üzerinde belirli bir dilde bulunan film ve dizilerin altyazılarını indiren bir crawlera scriptine ihtiyacımız var. Aşağıda crawler scriptinin takip edeceği adımlar ve gerekli kaynaklar ile ilgili açıklamalar bulunmakta.

### URLs

- https://www.opensubtitles.org/search/sublanguageid-[lang]/moviename-[letter]/offset-[offsetvalue]

    Bu bağlantı A harfi ile başlayan İngilizce dilinde bulunan altyazı dosyalarını listeler. [lang] değeri, altyazı dosyasının dilini, [letter] film adının ilk harfini, [offset] değeri sayfa listelemesinde sonraki değerleri listelemek için kullanılan parametreler.

- https://dl.opensubtitles.org/en/download/sub/[ID]

    Bu bağlantı ile herhangi bir altyazı dosyası, ID değeri kullanılarak indirilebilir. Script dosyaları `subtitles/archive/[ID].zip` dizinine ZIP formatında indiriyor.

## Evre 2 ― Toplanan verileri formatlama (formatter)

Toplanan altyazı dosyaları `subtitles/archive/[ID].zip` formatında indiriliyor ve zip dosyasının içeriği `subtitles/files/[ID]/` klasörüne çıkarılıyor. Altyazı dosyası ve dizi/film içeriği hakkında temel bir kaç bilgi `subtitles/files/[ID]/metadata.json` dosyası içerisine kaydediliyor.

## Evre 3 - Verileri sınıflandırmak ve anlamlandırmak (analyzer)

Bu aşamada bir önceki adımda formatlanan altyazı dosyalarındaki kelimeler sayılıyor ve hashmap tipinde `subtitles/files/[ID]/summary.json` dosyasına kaydediliyor. Aynı sayma işlemi tüm dosyalar için de gerçekleştirilerek tüm film/dizi içeriklerindeki kelimelerin tekrar sayıları `subtitles/files/summary.json` altına kaydediliyor.

## Evre 4 - Sınıflandırılan veriler için bir web arayüzü oluşturmak

*Eklenecek.*
