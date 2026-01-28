import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Globe, Camera, Save, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { profileApi } from '../api/profile';
import { UserProfile } from '../api/types';
import { useTranslation } from '../hooks/useTranslation';

export function ProfileSettings() {
    const { t, language, setSystemLanguage } = useTranslation();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [displayName, setDisplayName] = useState('');
    const [selectedLang, setSelectedLang] = useState('en');
    const [country, setCountry] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await profileApi.getProfile();
            setProfile(data);
            setDisplayName(data.display_name || '');
            setSelectedLang(data.lang || data.locale || 'en');
            setCountry(data.country || '');
            setPreviewImage(data.picture || null);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            toast.error('Failed to load profile information.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        try {
            toast.loading('Uploading image...');
            const response = await profileApi.uploadProfileImage(file);
            toast.dismiss();
            toast.success('Profile image updated!');

            // Update local profile state with new image URL
            setProfile(prev => prev ? { ...prev, picture: response.picture } : null);

            // Trigger global update event
            const updatedProfile = { ...profile, picture: response.picture };
            localStorage.setItem('uri-tomo-user-profile', JSON.stringify(updatedProfile));
            window.dispatchEvent(new Event('profile-updated'));

        } catch (error) {
            toast.dismiss();
            console.error('Image upload failed:', error);
            toast.error('Failed to upload image.');
            // Revert preview on error
            setPreviewImage(profile?.picture || null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        try {
            setSaving(true);
            const updateData = {
                display_name: displayName,
                lang: selectedLang,
                country: country
            };

            const updatedProfile = await profileApi.updateProfile(updateData);
            setProfile(updatedProfile);

            // Update system language if changed
            if (selectedLang !== language) {
                // Map backend lang code to frontend lang code if necessary
                // Assuming direct mapping for now based on 'ja', 'ko', 'en'
                if (['ja', 'ko', 'en'].includes(selectedLang)) {
                    setSystemLanguage(selectedLang as 'ja' | 'ko' | 'en');
                }
            }

            // Update local storage and notify other components
            localStorage.setItem('uri-tomo-user-profile', JSON.stringify({
                ...updatedProfile,
                name: updatedProfile.display_name, // legacy support
                avatar: updatedProfile.picture
            }));
            window.dispatchEvent(new Event('profile-updated'));

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-screen overflow-y-auto bg-gray-50/50 p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto space-y-6"
            >
                <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                        <User className="w-8 h-8 text-yellow-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                        <p className="text-gray-500">Manage your account settings and preferences</p>
                    </div>
                </div>

                <Card className="p-6 md:p-8 shadow-lg border-yellow-100/50 bg-white/80 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-yellow-100">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-yellow-50 flex items-center justify-center text-yellow-300">
                                            <User className="w-16 h-16" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <p className="text-sm text-gray-500 font-medium">Click to upload new photo</p>
                        </div>

                        <div className="grid gap-6">
                            {/* Email (Read-only) */}
                            <div className="space-y-2">
                                <Label className="text-gray-700">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        value={profile?.email || ''}
                                        disabled
                                        className="pl-10 bg-gray-50 border-gray-200"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                        Read-only
                                    </span>
                                </div>
                            </div>

                            {/* Display Name */}
                            <div className="space-y-2">
                                <Label htmlFor="displayName" className="text-gray-700">Display Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="displayName"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="pl-10 focus:ring-yellow-400 focus:border-yellow-400"
                                        placeholder="Enter your display name"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Language */}
                                <div className="space-y-2">
                                    <Label htmlFor="language" className="text-gray-700">Preferred Language</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <select
                                            id="language"
                                            value={selectedLang}
                                            onChange={(e) => setSelectedLang(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-400 border-gray-300 bg-white appearance-none"
                                        >
                                            <option value="ja">🇯🇵 Japanese (日本語)</option>
                                            <option value="ko">🇰🇷 Korean (한국어)</option>
                                            <option value="en">🇺🇸 English</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Country */}
                                <div className="space-y-2">
                                    <Label htmlFor="country" className="text-gray-700">Country / Region</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="country"
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                            className="pl-10 focus:ring-yellow-400 focus:border-yellow-400"
                                            placeholder="e.g. South Korea"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold px-8 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                {saving ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
