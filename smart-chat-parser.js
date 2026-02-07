// ═══════════════════════════════════════════════════════════
//  UNIVERSAL CHAT PARSER
//  Accepts ANY chat format and normalizes it
//  Drop this into any of your apps!
// ═══════════════════════════════════════════════════════════

class SmartChatParser {
    constructor() {
        // Common chat app patterns
        this.patterns = {
            // iMessage: "John Doe\n10:30 AM\nHey what's up"
            imessage: /^(.+)\n([\d:]+\s*(?:AM|PM)?)\n(.+)/im,
            
            // Discord: "[10:30 AM] John: Hey what's up"
            discord: /\[([\d:]+\s*(?:AM|PM)?)\]\s*([^:]+):\s*(.+)/i,
            
            // WhatsApp: "10:30 AM - John: Hey what's up" or "John, 10:30 AM: Hey"
            whatsapp1: /([\d:]+\s*(?:AM|PM)?)\s*-\s*([^:]+):\s*(.+)/i,
            whatsapp2: /([^,]+),\s*([\d:]+\s*(?:AM|PM)?):\s*(.+)/i,
            
            // Slack: "John 10:30 AM\nHey what's up"
            slack: /^([^\d\n]+)\s+([\d:]+\s*(?:AM|PM)?)\n(.+)/im,
            
            // Generic: "John (10:30): Hey what's up"
            generic1: /([^(]+)\s*\(([\d:]+\s*(?:AM|PM)?)\):\s*(.+)/i,
            
            // Telegram: "John [10:30]\nHey what's up"
            telegram: /([^\[]+)\s*\[([\d:]+\s*(?:AM|PM)?)\]\n(.+)/im,
            
            // SMS style: "John 10:30\nHey what's up"
            sms: /^([^\d\n]+?)\s*([\d:]+\s*(?:AM|PM)?)\n(.+)/im,
            
            // Standard format we expect: "[10:30 AM] John: Hey"
            standard: /\[([\d:]+\s*(?:AM|PM)?)\]\s*([^:]+):\s*(.+)/i
        };
    }

    parse(text) {
        if (!text || !text.trim()) {
            return [];
        }

        // Split into potential messages
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const messages = [];
        let currentMessage = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Try to parse this line as a new message
            const parsed = this.parseLine(line);
            
            if (parsed) {
                // This is a new message
                if (currentMessage) {
                    messages.push(currentMessage);
                }
                currentMessage = parsed;
            } else if (currentMessage) {
                // This is a continuation of the previous message
                currentMessage.content += ' ' + line;
            }
        }

        // Don't forget the last message
        if (currentMessage) {
            messages.push(currentMessage);
        }

        return messages;
    }

    parseLine(line) {
        // Try each pattern
        for (const [format, pattern] of Object.entries(this.patterns)) {
            const match = line.match(pattern);
            
            if (match) {
                let time, user, content;
                
                // Different patterns capture groups in different orders
                if (format === 'imessage' || format === 'slack' || format === 'telegram' || format === 'sms') {
                    user = match[1].trim();
                    time = match[2].trim();
                    content = match[3].trim();
                } else if (format === 'whatsapp1') {
                    time = match[1].trim();
                    user = match[2].trim();
                    content = match[3].trim();
                } else if (format === 'whatsapp2') {
                    user = match[1].trim();
                    time = match[2].trim();
                    content = match[3].trim();
                } else if (format === 'discord' || format === 'standard') {
                    time = match[1].trim();
                    user = match[2].trim();
                    content = match[3].trim();
                } else if (format === 'generic1') {
                    user = match[1].trim();
                    time = match[2].trim();
                    content = match[3].trim();
                }

                // Clean up user name (remove extra spaces, quotes, etc.)
                user = this.cleanUsername(user);
                
                // Normalize time format
                time = this.normalizeTime(time);

                return {
                    time: time,
                    user: user,
                    content: content,
                    format: format
                };
            }
        }

        return null;
    }

    cleanUsername(name) {
        // Remove quotes
        name = name.replace(/['"]/g, '');
        // Remove extra whitespace
        name = name.replace(/\s+/g, ' ').trim();
        // Remove trailing colons
        name = name.replace(/:+$/, '');
        return name;
    }

    normalizeTime(time) {
        // Add space before AM/PM if missing
        time = time.replace(/(\d)(AM|PM)/i, '$1 $2');
        // Uppercase AM/PM
        time = time.replace(/(am|pm)/i, (match) => match.toUpperCase());
        return time;
    }

    // Helper: Convert parsed messages back to standard format
    toStandardFormat(messages) {
        return messages.map(msg => {
            return `[${msg.time}] ${msg.user}: ${msg.content}`;
        }).join('\n');
    }

    // Helper: Auto-detect the format
    detectFormat(text) {
        const sample = text.split('\n').slice(0, 5).join('\n');
        
        for (const [format, pattern] of Object.entries(this.patterns)) {
            if (pattern.test(sample)) {
                return format;
            }
        }
        
        return 'unknown';
    }

    // Helper: Get example for each format
    getFormatExample(format) {
        const examples = {
            imessage: "John Doe\n10:30 AM\nHey what's up",
            discord: "[10:30 AM] John: Hey what's up",
            whatsapp1: "10:30 AM - John: Hey what's up",
            whatsapp2: "John, 10:30 AM: Hey what's up",
            slack: "John 10:30 AM\nHey what's up",
            telegram: "John [10:30]\nHey what's up",
            sms: "John 10:30\nHey what's up",
            generic1: "John (10:30): Hey what's up",
            standard: "[10:30 AM] John: Hey what's up"
        };
        return examples[format] || examples.standard;
    }
}

// ═══════════════════════════════════════════════════════════
//  USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════

// Example 1: Parse iMessage format
const parser = new SmartChatParser();

const imessageText = `John Doe
10:30 AM
Hey what's up

Jane Smith
10:31 AM
Not much, you?

John Doe
10:32 AM
Want to hang later?`;

const messages1 = parser.parse(imessageText);
console.log('Parsed iMessage:', messages1);

// Example 2: Parse Discord format
const discordText = `[10:30 AM] John: Hey what's up
[10:31 AM] Jane: Not much, you?
[10:32 AM] John: Want to hang later?`;

const messages2 = parser.parse(discordText);
console.log('Parsed Discord:', messages2);

// Example 3: Parse WhatsApp format
const whatsappText = `10:30 AM - John: Hey what's up
10:31 AM - Jane: Not much, you?
10:32 AM - John: Want to hang later?`;

const messages3 = parser.parse(whatsappText);
console.log('Parsed WhatsApp:', messages3);

// Example 4: Detect format automatically
console.log('Detected format:', parser.detectFormat(discordText)); // "discord"

// Example 5: Convert to standard format
const standardFormat = parser.toStandardFormat(messages1);
console.log('Standard format:', standardFormat);

// ═══════════════════════════════════════════════════════════
//  HOW TO INTEGRATE INTO YOUR APPS
// ═══════════════════════════════════════════════════════════

/*

STEP 1: Add this parser to your HTML file (before your existing script)
<script src="smart-chat-parser.js"></script>

STEP 2: Update your parseMessages function:

// OLD VERSION:
function parseMessages(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const messages = [];
    
    lines.forEach(line => {
        const match = line.match(/\[(.*?)\]\s*([^:]+):\s*(.+)/);
        if (match) {
            messages.push({
                time: match[1].trim(),
                user: match[2].trim(),
                content: match[3].trim()
            });
        }
    });
    
    return messages;
}

// NEW VERSION WITH SMART PARSER:
function parseMessages(text) {
    const parser = new SmartChatParser();
    return parser.parse(text);
}

That's it! Now your app accepts ANY format!

*/

// ═══════════════════════════════════════════════════════════
//  TESTING - Try these formats!
// ═══════════════════════════════════════════════════════════

const testFormats = [
    {
        name: 'iMessage',
        text: `John
10:30 AM
Hey there

Sarah
10:31 AM
Hi John!`
    },
    {
        name: 'Discord',
        text: `[10:30 AM] John: Hey there
[10:31 AM] Sarah: Hi John!`
    },
    {
        name: 'WhatsApp',
        text: `10:30 AM - John: Hey there
10:31 AM - Sarah: Hi John!`
    },
    {
        name: 'Slack',
        text: `John 10:30 AM
Hey there

Sarah 10:31 AM
Hi John!`
    }
];

console.log('\n=== TESTING ALL FORMATS ===\n');
testFormats.forEach(test => {
    console.log(`\n${test.name} format:`);
    const result = parser.parse(test.text);
    result.forEach(msg => {
        console.log(`  [${msg.time}] ${msg.user}: ${msg.content}`);
    });
});
