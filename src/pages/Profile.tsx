import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  AtSign,
  TrendingUp,
  Shield,
  Briefcase,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, portfolioApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';

interface PortfolioEntry {
  portfolio_id: string;
  symbol: string;
  quantity: number;
  average_price: number;
  current_price?: number;
  pnl?: number;
  pnl_percentage?: number;
  purchase_date?: string;
}

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    investment_style: '',
    risk_tolerance: '',
  });

  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    symbol: '',
    quantity: '',
    average_price: '',
    purchase_date: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        investment_style: user.investment_style || '',
        risk_tolerance: user.risk_tolerance || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const loadPortfolio = async () => {
      const { data } = await portfolioApi.getAll();
      if (data?.portfolio) {
        setPortfolio(data.portfolio);
      }
      setIsLoadingPortfolio(false);
    };

    if (isAuthenticated) {
      loadPortfolio();
    }
  }, [isAuthenticated]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { error } = await userApi.updateProfile(formData);
    setIsSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });
      await refreshUser();
      setIsEditing(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.symbol || !newEntry.quantity || !newEntry.average_price) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const { data, error } = await portfolioApi.add({
      symbol: newEntry.symbol.toUpperCase(),
      quantity: parseFloat(newEntry.quantity),
      average_price: parseFloat(newEntry.average_price),
      purchase_date: newEntry.purchase_date || undefined,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Entry added',
        description: 'Portfolio entry has been added.',
      });
      // Reload portfolio
      const { data: portfolioData } = await portfolioApi.getAll();
      if (portfolioData?.portfolio) {
        setPortfolio(portfolioData.portfolio);
      }
      setAddDialogOpen(false);
      setNewEntry({ symbol: '', quantity: '', average_price: '', purchase_date: '' });
    }
  };

  const handleDeleteEntry = async (portfolioId: string) => {
    await portfolioApi.delete(portfolioId);
    setPortfolio((prev) => prev.filter((e) => e.portfolio_id !== portfolioId));
    toast({
      title: 'Entry deleted',
      description: 'Portfolio entry has been removed.',
    });
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <h1 className="text-2xl font-bold mb-8">Profile & Portfolio</h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Profile Information</h2>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                  />
                ) : (
                  <p className="font-medium">{user?.full_name || '-'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <p className="font-medium">{user?.email || '-'}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm flex items-center gap-2">
                  <AtSign className="h-4 w-4" />
                  Username
                </Label>
                <p className="font-medium">@{user?.username || '-'}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Investment Style
                </Label>
                {isEditing ? (
                  <Select
                    value={formData.investment_style}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, investment_style: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium capitalize">
                    {user?.investment_style || '-'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Risk Tolerance
                </Label>
                {isEditing ? (
                  <Select
                    value={formData.risk_tolerance}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, risk_tolerance: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tolerance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium capitalize">
                    {user?.risk_tolerance || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Portfolio Holdings
              </h2>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Portfolio Entry</DialogTitle>
                    <DialogDescription>
                      Add a new stock to your portfolio
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Symbol</Label>
                      <Input
                        placeholder="e.g., RELIANCE"
                        value={newEntry.symbol}
                        onChange={(e) =>
                          setNewEntry((prev) => ({ ...prev, symbol: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          placeholder="50"
                          value={newEntry.quantity}
                          onChange={(e) =>
                            setNewEntry((prev) => ({ ...prev, quantity: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Avg Price (₹)</Label>
                        <Input
                          type="number"
                          placeholder="2500"
                          value={newEntry.average_price}
                          onChange={(e) =>
                            setNewEntry((prev) => ({
                              ...prev,
                              average_price: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Purchase Date (optional)</Label>
                      <Input
                        type="date"
                        value={newEntry.purchase_date}
                        onChange={(e) =>
                          setNewEntry((prev) => ({
                            ...prev,
                            purchase_date: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button className="w-full" onClick={handleAddEntry}>
                      Add Entry
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingPortfolio ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : portfolio.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No holdings yet. Add your first stock!</p>
              </div>
            ) : (
              <ScrollArea className="max-h-80">
                <div className="space-y-3">
                  {portfolio.map((entry) => (
                    <div
                      key={entry.portfolio_id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{entry.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.quantity} shares @ ₹{entry.average_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {entry.pnl !== undefined && (
                          <div
                            className={`text-right ${
                              entry.pnl >= 0 ? 'text-kubera-success' : 'text-destructive'
                            }`}
                          >
                            <p className="font-medium">
                              {entry.pnl >= 0 ? '+' : ''}₹{entry.pnl.toFixed(2)}
                            </p>
                            <p className="text-sm">
                              {entry.pnl_percentage?.toFixed(2)}%
                            </p>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEntry(entry.portfolio_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
