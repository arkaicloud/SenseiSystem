import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Bold, 
  Italic, 
  Underline, 
  Image, 
  Smile, 
  Palette,
  Send,
  Edit,
  Trash2,
  Calendar,
  MessageSquare
} from "lucide-react";

interface Communication {
  id: number;
  title: string;
  content: string;
  type: 'announcement' | 'event';
  priority: 'low' | 'medium' | 'high';
  targetAudience: 'all' | 'students' | 'instructors';
  publishDate: Date;
  eventDate?: Date;
  imageUrl?: string;
  createdBy: string;
  isPublished: boolean;
}

const Communications: React.FC = () => {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'announcement' as 'announcement' | 'event',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetAudience: 'all' as 'all' | 'students' | 'instructors',
    eventDate: '',
    imageUrl: ''
  });

  const contentRef = useRef<HTMLDivElement>(null);

  // Mock data for communications
  const mockCommunications: Communication[] = [
    {
      id: 1,
      title: "Campeonato Interno de Jiu-Jitsu",
      content: "<p><strong>Grande evento!</strong> 🥋 Nosso campeonato interno acontecerá no próximo mês. <em>Inscrições abertas!</em></p>",
      type: 'event',
      priority: 'high',
      targetAudience: 'all',
      publishDate: new Date(),
      eventDate: new Date('2024-02-15'),
      imageUrl: '',
      createdBy: 'Arkaia Admin',
      isPublished: true
    },
    {
      id: 2,
      title: "Mudança no Horário das Aulas",
      content: "<p>Informamos que a partir da próxima semana teremos <span style='background-color: yellow;'>alterações nos horários</span> das aulas noturnas.</p>",
      type: 'announcement',
      priority: 'medium',
      targetAudience: 'all',
      publishDate: new Date(),
      createdBy: 'Arkaia Admin',
      isPublished: true
    }
  ];

  const handleFormatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const handleColorChange = (color: string) => {
    handleFormatText('foreColor', color);
  };

  const handleBackgroundColor = (color: string) => {
    handleFormatText('hiliteColor', color);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = `<img src="${e.target?.result}" style="max-width: 100%; height: auto;" />`;
        document.execCommand('insertHTML', false, img);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertEmoji = (emoji: string) => {
    document.execCommand('insertHTML', false, emoji);
    contentRef.current?.focus();
  };

  const handleSubmit = () => {
    const content = contentRef.current?.innerHTML || '';
    if (!formData.title || !content) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally call the API
    toast({
      title: "Sucesso",
      description: `${formData.type === 'event' ? 'Evento' : 'Comunicado'} criado com sucesso!`,
    });
    
    setIsCreateOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'announcement',
      priority: 'medium',
      targetAudience: 'all',
      eventDate: '',
      imageUrl: ''
    });
    if (contentRef.current) {
      contentRef.current.innerHTML = '';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'event' ? <Calendar className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comunicados e Eventos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie comunicados e eventos da escola
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-secondary-dark">
              <Plus className="w-4 h-4 mr-2" />
              Novo Comunicado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogTitle>Criar Novo Comunicado/Evento</DialogTitle>
            
            <div className="space-y-4">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Digite o título..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(value: 'announcement' | 'event') => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Comunicado</SelectItem>
                      <SelectItem value="event">Evento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({...formData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Público Alvo</Label>
                  <Select value={formData.targetAudience} onValueChange={(value: 'all' | 'students' | 'instructors') => setFormData({...formData, targetAudience: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="students">Apenas Alunos</SelectItem>
                      <SelectItem value="instructors">Apenas Instrutores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.type === 'event' && (
                  <div className="space-y-2">
                    <Label>Data do Evento</Label>
                    <Input
                      type="datetime-local"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                    />
                  </div>
                )}
              </div>

              {/* Editor Rico */}
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                
                {/* Barra de Ferramentas */}
                <div className="border rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFormatText('bold')}
                    className="p-2"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFormatText('italic')}
                    className="p-2"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFormatText('underline')}
                    className="p-2"
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="p-2"
                    >
                      <Palette className="w-4 h-4" />
                    </Button>
                    <input
                      type="color"
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-8 h-8 border rounded cursor-pointer"
                    />
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBackgroundColor('#ffff00')}
                    className="p-2 bg-yellow-200"
                  >
                    Destacar
                  </Button>
                  
                  <div className="flex items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="p-2"
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="flex gap-1">
                    {['😀', '😎', '💪', '🥋', '🏆', '👏', '🔥', '⚡'].map((emoji) => (
                      <Button
                        key={emoji}
                        size="sm"
                        variant="outline"
                        onClick={() => insertEmoji(emoji)}
                        className="p-1 text-lg"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Área de Texto Rica */}
                <div
                  ref={contentRef}
                  contentEditable
                  className="min-h-[200px] p-4 border border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  style={{ whiteSpace: 'pre-wrap' }}
                  data-placeholder="Digite o conteúdo do comunicado..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} className="bg-secondary hover:bg-secondary-dark">
                  <Send className="w-4 h-4 mr-2" />
                  Publicar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Comunicados */}
      <div className="grid gap-4">
        {mockCommunications.map((comm) => (
          <Card key={comm.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(comm.type)}
                  <CardTitle className="text-lg">{comm.title}</CardTitle>
                  <Badge className={getPriorityColor(comm.priority)}>
                    {comm.priority === 'high' ? 'Alta' : comm.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Por: {comm.createdBy}</span>
                <span>Publicado: {formatDate(comm.publishDate)}</span>
                {comm.eventDate && (
                  <span>Evento: {formatDate(comm.eventDate)}</span>
                )}
                <Badge variant="outline">
                  {comm.targetAudience === 'all' ? 'Todos' : 
                   comm.targetAudience === 'students' ? 'Alunos' : 'Instrutores'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: comm.content }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Communications;