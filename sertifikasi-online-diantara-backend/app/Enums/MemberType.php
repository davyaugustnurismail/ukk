<?php

namespace App\Enums;

enum MemberType: string
{
    case PESERTA = 'peserta';
    case NARASUMBER = 'narasumber';
    case PANITIA = 'panitia';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function getRoleId(string $type): int
    {
        return match ($type) {
            self::PESERTA->value => 3,
            self::NARASUMBER->value => 4,
            self::PANITIA->value => 5,
            default => 3,
        };
    }

    public static function fromRoleId(int $roleId): string
    {
        return match ($roleId) {
            4 => self::NARASUMBER->value,
            5 => self::PANITIA->value,
            default => self::PESERTA->value,
        };
    }
}