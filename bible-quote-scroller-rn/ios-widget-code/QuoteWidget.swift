import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), quote: "For I know the plans I have for you...")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), quote: "For I know the plans I have for you...")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []
        let currentDate = Date()
        
        let sharedDefaults = UserDefaults(suiteName: "group.com.yourname.biblescroller")
        let rawQuotes = sharedDefaults?.string(forKey: "saved_quotes_widget_str") ?? "The Lord is my shepherd; I shall not want."
        let savedQuotes = rawQuotes.components(separatedBy: "|||").filter { !$0.isEmpty }

        // Rotate quotes at midnight
        let dayOfYear = Calendar.current.ordinality(of: .day, in: .year, for: currentDate) ?? 0
        let currentQuote = savedQuotes.isEmpty ? "No saved quotes yet." : savedQuotes[dayOfYear % savedQuotes.count]

        let entry = SimpleEntry(date: currentDate, quote: currentQuote)
        entries.append(entry)

        // Refresh timeline every midnight
        let midnight = Calendar.current.startOfDay(for: currentDate).addingTimeInterval(86400)
        let timeline = Timeline(entries: entries, policy: .after(midnight))
        
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let quote: String
}

struct QuoteWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.05).ignoresSafeArea()
            VStack {
                Text(entry.quote)
                    .font(.system(size: 14, weight: .medium, design: .serif))
                    .foregroundColor(Color(red: 0.94, green: 0.94, blue: 0.94))
                    .multilineTextAlignment(.center)
                    .padding()
            }
        }
    }
}

@main
struct QuoteWidget: Widget {
    let kind: String = "QuoteWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            QuoteWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Daily Saved Quote")
        .description("Your favorite saved quotes rotating daily.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
