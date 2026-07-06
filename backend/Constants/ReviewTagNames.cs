namespace NookBook.API.Constants;

public static class ReviewTagNames
{
    public static readonly string[] Positive =
    {
        "Чистота", "Комфорт", "Персонал", "Завтрак", "Расположение", "Wi-Fi",
        "Парковка", "Бассейн", "Спортзал", "Тишина", "Цена-качество", "Вид из окна"
    };

    public static readonly string[] Negative =
    {
        "Шум", "Грязно", "Плохой Wi-Fi", "Нет парковки", "Некомфортная кровать",
        "Сломанный душ", "Невежливый персонал", "Дорого", "Холодно", "Жарко"
    };

    public static readonly HashSet<string> PositiveSet =
        new(Positive, StringComparer.OrdinalIgnoreCase);

    public static readonly HashSet<string> NegativeSet =
        new(Negative, StringComparer.OrdinalIgnoreCase);
}
