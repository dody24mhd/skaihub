<?php

namespace App\Services;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Disk tujuan upload (FILESYSTEM_UPLOAD_DISK): "public" (disk lokal, URL /storage/...)
 * atau disk cloud seperti "s3" untuk Cloudflare R2 (URL dari AWS_URL).
 */
class UploadStorage
{
    public function diskName(): string
    {
        return (string) config('filesystems.upload_disk', 'public');
    }

    public function disk(): Filesystem
    {
        return Storage::disk($this->diskName());
    }

    public function store(UploadedFile $file, string $directory): string
    {
        $path = $file->store($directory, $this->diskName());

        if ($path === false) {
            throw new RuntimeException("Gagal menyimpan berkas unggahan ke disk [{$this->diskName()}].");
        }

        return $path;
    }

    public function url(string $path): string
    {
        $url = $this->disk()->url($path);

        return parse_url($url, PHP_URL_HOST) ? $url : asset($url);
    }

    /** Path URL tempat berkas disk dilayani, tanpa garis miring akhir (mis. "/storage" atau ""). */
    public function urlBasePath(): string
    {
        return rtrim((string) parse_url($this->url(''), PHP_URL_PATH), '/');
    }

    /**
     * Host yang sah untuk URL berkas. Disk lokal dilayani oleh API sendiri sehingga host API
     * juga diterima; disk cloud hanya dari host URL publiknya.
     *
     * @return list<string>
     */
    public function allowedHosts(Request $request): array
    {
        $hosts = [parse_url($this->url(''), PHP_URL_HOST)];

        if ($this->isLocal()) {
            $hosts[] = parse_url(config('app.url'), PHP_URL_HOST);
            $hosts[] = $request->getHost();
        }

        return array_values(array_unique(array_filter($hosts)));
    }

    public function isLocal(): bool
    {
        return config("filesystems.disks.{$this->diskName()}.driver") === 'local';
    }
}
