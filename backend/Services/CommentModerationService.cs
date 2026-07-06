using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace NookBook.API.Services;

public class CommentModerationService
{
    private static readonly ConcurrentDictionary<string, bool> _profanityWords = new(StringComparer.OrdinalIgnoreCase);
    private static readonly ConcurrentDictionary<string, string> _spamPatterns = new(StringComparer.OrdinalIgnoreCase);

    public sealed class ModerationResult
    {
        public bool HasProfanity { get; init; }
        public bool HasSpam { get; init; }
        public string SanitizedText { get; init; } = string.Empty;
        public string SpamReason { get; init; } = string.Empty;
    }
    
    static CommentModerationService()
    {
        var profanityWords = new[]
        {
            "мат", "блядь", "сука", "пизда", "хуй", "ебать", "ебаный", "пидор", "гандон",
            "мудак", "чмо", "урод", "тупой", "идиот", "дурак", "дебил", "имбецил",
            "тварь", "скотина", "сволочь", "мерзавец", "подлец", "негодяй",
            "fuck", "shit", "ass", "bitch", "damn", "hell", "crap", "dick",
            "pussy", "cock", "whore", "slut", "bastard", "idiot", "stupid",
            "moron", "retard", "dumb", "asshole", "jerk", "loser"
        };

        foreach (var word in profanityWords)
        {
            _profanityWords.TryAdd(word, true);
        }

        _spamPatterns.TryAdd(@"https?:\/\/", "обнаружены ссылки");
        _spamPatterns.TryAdd(@"www\.", "обнаружены ссылки");
        _spamPatterns.TryAdd(@"t\.me\/|telegram", "обнаружены контакты мессенджеров");
        _spamPatterns.TryAdd(@"(купи|продам|скидк|заработок|криптовал|казино|букмекер)", "обнаружены рекламные фразы");
        _spamPatterns.TryAdd(@"(\+?\d[\d\-\s]{8,})", "обнаружены контакты");
    }

    public ModerationResult Analyze(string comment)
    {
        if (string.IsNullOrWhiteSpace(comment))
        {
            return new ModerationResult
            {
                HasProfanity = false,
                HasSpam = false,
                SanitizedText = string.Empty,
                SpamReason = string.Empty
            };
        }

        var trimmed = comment.Trim();
        var hasProfanity = ContainsProfanity(trimmed);
        var hasSpam = false;
        var spamReason = string.Empty;

        foreach (var pattern in _spamPatterns)
        {
            if (Regex.IsMatch(trimmed, pattern.Key, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
            {
                hasSpam = true;
                spamReason = pattern.Value;
                break;
            }
        }

        return new ModerationResult
        {
            HasProfanity = hasProfanity,
            HasSpam = hasSpam,
            SanitizedText = trimmed,
            SpamReason = spamReason
        };
    }

    public bool ContainsBlacklistedWords(string comment)
    {
        return ContainsProfanity(comment);
    }

    private bool ContainsProfanity(string comment)
    {
        var normalized = comment.ToLowerInvariant();
        
        var words = normalized.Split(new[] { ' ', ',', '.', '!', '?', ';', ':', '\n', '\r', '\t', '-', '_', '+', '=', '*', '/', '\\', '(', ')', '[', ']', '{', '}', '<', '>', '"', '\'' },
            StringSplitOptions.RemoveEmptyEntries);

        foreach (var word in words)
        {
            if (_profanityWords.ContainsKey(word))
                return true;
        }

        foreach (var profanityWord in _profanityWords.Keys)
        {
            var pattern = BuildLeetPattern(profanityWord);
            if (Regex.IsMatch(normalized, pattern, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
                return true;
        }

        return false;
    }

    private string BuildLeetPattern(string word)
    {
        var substitutions = new Dictionary<char, string>
        {
            {'a', "[a4@]"},
            {'b', "[b68]"},
            {'c', "[c(]"},
            {'e', "[e3]"},
            {'g', "[g9]"},
            {'i', "[i1l!]"},
            {'l', "[l1i]"},
            {'o', "[o0]"},
            {'s', "[s5$]"},
            {'t', "[t7]"},
            {'z', "[z2]"},
            {'х', "[xх]"},
            {'у', "[yу]"},
            {'а', "[aа@]"},
            {'о', "[oо0]"},
            {'е', "[eе3]"},
            {'р', "[pр]"},
            {'с', "[cс]"},
            {'к', "[kк]"},
            {'н', "[hн]"},
            {'м', "[mм]"},
            {'и', "[iи1]"},
            {'т', "[tт7]"},
            {'ь', "[bь]"},
            {'я', "[rя]"},
            {'ю', "[ioю]"},
            {'ё', "[eё]"},
            {'ж', "[xж]"},
            {'ш', "[wш]"},
            {'щ', "[wщ]"},
            {'ч', "[4ч]"},
            {'ц', "[cц]"},
            {'ф', "[fф]"},
            {'ы', "[bы]"},
            {'в', "[bв]"},
            {'п', "[nп]"},
            {'л', "[lл]"},
            {'д', "[dд]"},
            {'г', "[gг]"},
            {'б', "[bб]"},
            {'з', "[zз3]"},
            {'й', "[jй]"},
            {'ъ', "[bъ]"},
            {'э', "[eэ]"},
        };

        var pattern = new System.Text.StringBuilder();
        foreach (char c in word.ToLowerInvariant())
        {
            if (substitutions.ContainsKey(c))
            {
                pattern.Append(substitutions[c]);
            }
            else
            {
                pattern.Append(Regex.Escape(c.ToString()));
            }
        }

        return pattern.ToString();
    }

    private string MaskProfanity(string input)
    {
        var result = input;
        foreach (var word in _profanityWords.Keys)
        {
            var pattern = BuildLeetPattern(word);
            result = Regex.Replace(
                result,
                pattern,
                match => new string('*', Math.Max(3, match.Value.Length)),
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        }

        return result;
    }

    public void AddBlacklistedWord(string word)
    {
        if (!string.IsNullOrWhiteSpace(word))
        {
            _profanityWords.TryAdd(word.Trim(), true);
        }
    }

    public void RemoveBlacklistedWord(string word)
    {
        _profanityWords.TryRemove(word, out _);
    }

    public IEnumerable<string> GetBlacklistedWords()
    {
        return _profanityWords.Keys;
    }
}
